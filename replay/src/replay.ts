import moment = require('moment-timezone');
import mysql = require('mysql');

import { ICapture, IpcNode, IReplayIpcNodeDelegate, Logging } from '@lbt-mycrt/common';
import { mycrtDbConfig, ReplayDao, ReplayIpcNode } from '@lbt-mycrt/common';
import { CPUMetric, MemoryMetric, MetricsBackend, ReadMetric, WriteMetric } from '@lbt-mycrt/common';
import { Subprocess } from '@lbt-mycrt/common/dist/capture-replay/subprocess';
import { ByteToMegabyte, ChildProgramStatus, ChildProgramType, IChildProgram } from '@lbt-mycrt/common/dist/data';
import { ICommand, IDbReference, IWorkload } from '@lbt-mycrt/common/dist/data';
import { MetricsStorage } from '@lbt-mycrt/common/dist/metrics/metrics-storage';
import { StorageBackend } from '@lbt-mycrt/common/dist/storage/backend';
import { path as schema } from '@lbt-mycrt/common/dist/storage/backend-schema';

import { Moment } from 'moment';
import { ReplayConfig } from './args';
import { captureDao, replayDao } from './dao';
import { settings } from './settings';

const logger = Logging.defaultLogger(__dirname);

export class Replay extends Subprocess implements IReplayIpcNodeDelegate {

   private ipcNode: IpcNode;
   private capture: ICapture | null = null;
   private expectedEndTime?: Date;
   private firstLoop: boolean = true;
   private dbRef: IDbReference;
   private targetDb?: any;
   private workload?: IWorkload;
   private workloadStart?: Moment;
   private workloadEnd?: Moment;
   private replayStartTime?: Moment;
   private replayEndTime?: Moment;
   private workloadPath?: string;
   private workloadIndex: number = 0;
   private hasError: boolean = false;

   constructor(public config: ReplayConfig, storage: StorageBackend, metrics: MetricsBackend, db: IDbReference) {
      super(storage, metrics);
      this.ipcNode = new ReplayIpcNode(this.id, logger, this);
      this.dbRef = db;
   }

   get id(): number {
      return this.config.id;
   }

   get nameId(): string {
      return `replay ${this.id}`;
   }

   get interval(): number {
      return this.config.interval;
   }

   public asIChildProgram(): IChildProgram {
      return {
         id: this.id,
         type: ChildProgramType.REPLAY,
         status: this.status,
         start: this.startTime || undefined,
      };
   }

   protected async setup(): Promise<void> {
      try {

         logger.info(`Setting Replay ${this.id} status to 'starting'`);
         await replayDao.updateReplayStatus(this.id, ChildProgramStatus.STARTING);

         logger.info(`Replay ${this.id}: setup`);
         this.ipcNode.start();

         this.capture = await captureDao.getCapture(this.config.captureId);

         this.targetDb = this.config.mock ? mycrtDbConfig : { database: this.dbRef.name,
                                                              host: this.dbRef.host,
                                                              password: this.dbRef.pass,
                                                              user: this.dbRef.user };

         this.workload = await this.getWorkload();

      } catch (error) {
         this.selfDestruct(error);
      }
   }

   protected async loop(): Promise<void> {

      logger.info('-----------==[ LOOP ]==-----------');
      if (this.firstLoop === true) {
        await this.firstLoopInit();
      }

      let finished = true;

      logger.info(`-< Scheduling Commands >---------`);
      while (this.indexInInterval(this.workloadIndex)) {

         const currentIndex = this.workloadIndex;
         const delay = this.getDelayForIndex(currentIndex);
         const currentQuery = this.workload!.commands[currentIndex];

         logger.info(`   * Scheduling command ${currentIndex + 1} of ${this.workload!.commands.length}`);
         logger.info(`      delay = ${delay}`);
         setTimeout(async () => {
            try {
               await this.processQuery(currentQuery);
            } catch (error) {
               logger.info(`Error while processing query with index ${currentIndex}: ${error}`);
            }
         }, delay);
         logger.info(`      scheduled!`);

         // don't let the subprocess end because we still need to run these queries.
         finished = false;
         this.workloadIndex += 1;
      }

      if (this.shouldWeContinue()) {
        finished = false;
      }

      const metricsDelay = this.config.mock ? 0 : 200000;
      logger.info(`-< waiting ${metricsDelay}ms before gathering metrics >-----`);
      setTimeout(async () => {
         logger.info(`-< Logging Metrics >-------------`);
         this.logMetrics();
      }, metricsDelay);

      if (finished) {
        logger.info(`-< Stopping >------------------`);
        this.stop(false); // just once for now
      }

      logger.info(`--==[ LOOP DONE ]==---------------`);
   }

   protected async teardown(): Promise<void> {
      logger.info(`Replay ${this.id}: teardown`);

      if (!this.hasError) {
         await replayDao.updateReplayStatus(this.id, ChildProgramStatus.DONE);
      }

      await replayDao.updateReplayEndTime(this.id);
      this.ipcNode.stop();
   }

   protected async dontPanic(): Promise<void> {
      await replayDao.updateReplayStatus(this.id, ChildProgramStatus.FAILED);
   }

   private async firstLoopInit() {
     try {
        this.firstLoop = false;
        this.startTime = new Date();
        this.replayStartTime = moment(this.startTime);
        await replayDao.updateReplayStartTime(this.id);

        this.replayEndTime = this.replayStartTime.clone().add(this.workloadEnd!.diff(this.workloadStart));
        logger.info(`Replay ${this.id} startTime: ${this.replayStartTime.toJSON()}`);
        logger.info(`Replay ${this.id}   endTime: ${this.replayEndTime.toJSON()}`);

        await replayDao.updateReplayStatus(this.id, ChildProgramStatus.RUNNING);

     } catch (error) {
        this.selfDestruct(error);
     }
   }

   private async getWorkload(): Promise<IWorkload> {

      logger.info(`Getting workload from storage`);
      this.workloadPath = schema.workload.getDoneKey({
         id: this.capture!.id,
         type: ChildProgramType.CAPTURE,
      });

      const temp: IWorkload = await this.storage.readJson<IWorkload>(this.workloadPath);

      if (temp) {
        logger.info(`Workload Retrieved`);
        this.workloadStart = moment(new Date(temp.start));
        this.workloadEnd = moment(new Date(temp.end));

        logger.info(`workloadStart: ${this.workloadStart.format()}`);
        logger.info(`workloadEnd:   ${this.workloadEnd.format()}`);
      }
      return temp;
   }

   private indexInInterval(currentIndex: number): boolean {

      return currentIndex < this.workload!.commands.length && this.queryInInterval(currentIndex);
   }

   private shouldWeContinue(): boolean {
      return this.workloadIndex < this.workload!.commands.length || this.replayEndTime!.diff(moment()) > 0;
   }

   private queryInInterval(index: number): boolean {

      const delay = this.getDelayForIndex(index);
      return (delay >= 0 && delay < this.interval);
   }

   private getDelayForIndex(index: number): number {

      if (index >= 0 && index < this.workload!.commands.length) {

         let queryStart: Moment;

         if (this.config.mock) {
            queryStart = moment(this.workload!.commands[index].event_time);
         } else {
            queryStart = moment(this.workload!.commands[index].event_time);
         }

         const delay = (queryStart.diff(this.workloadStart)) - (moment().diff(this.replayStartTime));

         return delay;
      } else {
         return 0;
      }
   }

   private validMockQuery(query: ICommand): boolean {

    let valid = true;
    settings.invalidQueries.forEach((value) => {
        if (query.argument.toUpperCase().indexOf(value) !== -1) {
            valid = false;
        }
    });
    return valid;
   }

   private processQuery(query: ICommand) {

      if (this.config.mock && !this.validMockQuery(query)) {
        return null;
      }

      const conn = mysql.createConnection(this.targetDb);

      logger.info(`--< Running Query >------------------------------------`);
      logger.info(`   "${query.argument.replace('\n', ' ')}"`);
      return new Promise<any>((resolve, reject) => {
         conn.connect((connErr) => {
            if (connErr) {
               reject(connErr);
            } else {
               const updateStr = mysql.format(query.argument, []);
               conn.query(updateStr, (updateErr, rows) => {
                  conn.end();
                  if (updateErr) {
                     reject(updateErr);
                  } else {
                     resolve(rows);
                  }
               });
            }
         });
      });
   }

   private logMetrics() {

      const end = moment();
      let start = end.clone().subtract(this.interval + this.config.intervalOverlap);

      if (start.diff(this.replayStartTime!) < 0) {
        start = this.replayStartTime!;
      }

      if (end.toDate().getTime() - start.toDate().getTime() > this.config.intervalOverlap) {
         logger.info(`   retrieving metrics from ${start.toDate()} to ${end.toDate()}`);
         this.sendMetricsToS3(start.toDate(), end.toDate());
      } else {
         logger.info(`   skipping metrics, not enough time has passed`);
      }

   }

   private async sendMetricsToS3(start: Date, end: Date) {

      this.tryTwice(async () => {

         logger.info(`      * memory...`);
         const memoryMetrics = await this.metrics.getMetricsForType(MemoryMetric, start, end);
         const datapoints = memoryMetrics.dataPoints;

         datapoints.forEach((metric) => {
            metric.Unit = "Megabytes";
            metric.Maximum *= ByteToMegabyte;
         });

         logger.info(`      * cpu...`);
         const cpu = await this.metrics.getMetricsForType(CPUMetric, start, end);
         logger.info(`      * read...`);
         const read = await this.metrics.getMetricsForType(ReadMetric, start, end);
         logger.info(`      * write...`);
         const write = await this.metrics.getMetricsForType(WriteMetric, start, end);

         const data = [cpu, read, write, memoryMetrics];

         const key = schema.metrics.getSingleSampleKey(this.asIChildProgram(), end);
         logger.info(`      * saving metrics to ${key}`);
         await this.storage.writeJson(key, data);
         logger.info(`      * done!`);

      }, "Send Metrics to S3");

   }

}
