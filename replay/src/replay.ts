import moment = require('moment-timezone');
import mysql = require('mysql');

import { ICapture, IpcNode, IReplayIpcNodeDelegate, Logging } from '@lbt-mycrt/common';
import { mycrtDbConfig, ReplayDao, ReplayIpcNode } from '@lbt-mycrt/common';
import { CPUMetric, MemoryMetric, MetricsBackend, ReadMetric, WriteMetric } from '@lbt-mycrt/common';
import { Subprocess } from '@lbt-mycrt/common/dist/capture-replay/subprocess';
import { ByteToMegabyte, ChildProgramStatus, ChildProgramType, IChildProgram,
   IDbReference } from '@lbt-mycrt/common/dist/data';
import { ICommand, IWorkload } from '@lbt-mycrt/common/dist/data';
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
   private capture?: ICapture | null;
   private expectedEndTime?: Date;
   private firstLoop: boolean = true;
   private targetDb: IDbReference;
   private workload?: IWorkload;
   private workloadStart?: Moment;
   private workloadEnd?: Moment;
   private replayStartTime?: Moment;
   private replayEndTime?: Moment;
   private workloadPath?: string;
   private workloadIndex: number = 0;
   private error: boolean = false;

   constructor(public config: ReplayConfig, storage: StorageBackend, metrics: MetricsBackend, db: IDbReference) {
      super(storage, metrics);
      this.ipcNode = new ReplayIpcNode(this.id, logger, this);
      this.targetDb = db;
   }

   get id(): number {
      return this.config.id;
   }

   get nameId(): string {
      return `replay ${this.id}`;
   }

   get interval(): number {

      if (this.replayEndTime === undefined) {
        return this.config.interval;
      }

      // uncomment when capture workloads have correct 'end' datetime
      // const timeToEnd = this.replayEndTime.diff(moment());
      // if (timeToEnd < this.config.interval ) {
      //    return timeToEnd;
      // } else {
      //   return this.config.interval;
      // }
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

         await this.getWorkload();

      } catch (error) {
         this.selfDestruct(error);
      }
   }

   protected async loop(): Promise<void> {

      logger.info('-----------==[ LOOP ]==-----------');
      if (this.firstLoop === true) {
        this.firstLoopInit();
      }

      let finished = true;

      while (this.workloadIndex < this.workload!.commands.length && this.queryInInterval(this.workloadIndex)) {

         const delay = this.getDelayForIndex(this.workloadIndex);
         const currentIndex = this.workloadIndex;
         const currentQuery = this.workload!.commands[currentIndex];

         setTimeout(() => {
          this.processQuery(currentQuery); }, delay);
         logger.info(`Scheduled query: ${this.workloadIndex}`);

         // don't let the subprocess end because we still need to run these queries.
         finished = false;
         this.workloadIndex += 1;
      }

      if (this.workloadIndex < this.workload!.commands.length || this.replayEndTime!.diff(moment()) > 0) {
        // don't let the subprocess end because we still have queries to que.
        finished = false;
      }

      this.logMetrics();

      if (finished) {
        this.stop(false); // just once for now
      }
   }

   protected async teardown(): Promise<void> {
      logger.info(`Replay ${this.id}: teardown`);

      if (this.error === false) {
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
        this.replayStartTime = moment();
        await replayDao.updateReplayStartTime(this.id);

        this.replayEndTime = this.replayStartTime.clone().add(this.workloadEnd!.diff(this.workloadStart));
        logger.info(`Replay ${this.id} startTime: ${this.replayStartTime.toJSON()}`);
        logger.info(`Replay ${this.id}   endTime: ${this.replayEndTime.toJSON()}`);

        await replayDao.updateReplayStatus(this.id, ChildProgramStatus.RUNNING);

     } catch (error) {
        this.selfDestruct(error);
     }
   }

   private getCaptureWorkloadPath(id: number): string {
      return `capture${id}/workload.json`;
  }

   private async getWorkload() {

      logger.info(`Getting workload from storage`);
      this.workloadPath = this.getCaptureWorkloadPath(this.config.captureId);
      this.workload = await this.storage.readJson(this.workloadPath) as IWorkload;

      if (this.workload) {
        logger.info(`Workload Retrieved`);
        this.workloadStart = moment(new Date(this.workload.start));
        this.workloadEnd = moment(new Date(this.workload.end));

        logger.info(`workloadStart: ${this.workloadStart.format()}`);
        logger.info(`workloadEnd:   ${this.workloadEnd.format()}`);
      }
   }

   // queryInInterval takes the index of the query in the workload and the time
   //                 that next loop will begin in milliseconds and returns true
   //                 if the query should be scheduled for the current loop otherwise false.
   private queryInInterval(index: number): boolean {

      const delay = this.getDelayForIndex(index);
      logger.info(`Delay for index: ${index} is ${delay}`);
      return (delay >= 0 && delay < this.interval) ? true : false  ;
   }

   // getDelayForIndex takes in an index and the current interval's start time and returns the
   //                  number of milliseconds to delay from the interval's start time.
   private getDelayForIndex(index: number): number {
      if (this.workload == null) {
         return 0;
      } else if (index >= 0 && index < this.workload!.commands.length) {

         const queryStart: Moment = moment(this.workload!.commands[index].event_time).subtract(8, 'hours');
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

   private validQuery(query: ICommand) {
    return (query.command_type === "Query");
   }

   private processQuery(query: ICommand) {

      const db = this.config.mock ? mycrtDbConfig : { database: this.targetDb.name,
                                                      host: this.targetDb.host,
                                                      password: this.targetDb.pass,
                                                      user: this.targetDb.user };

      if (this.config.mock && this.validMockQuery(query) === false) {
        return null;
      }

      if (this.validQuery(query)) {

        const conn = mysql.createConnection(db);

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

      } else { return null; }
   }

   private logMetrics() {

      const end = moment();
      let start = end.clone().subtract(this.interval + this.config.intervalOverlap);

      if (start.diff(this.workloadStart) < 0) {
        start = this.workloadStart!;
      }

      this.sendMetricsToS3(start.toDate(), end.toDate());

   }

   private async sendMetricsToS3(start: Date, end: Date, firstTry: boolean = true) {
      try {

         const memoryMetrics = await this.metrics.getMetricsForType(MemoryMetric, start, end);

         memoryMetrics.dataPoints.forEach((metric) => {
            metric.Unit = "Megabytes";
            metric.Maximum *= ByteToMegabyte;
         });

         const data = [
            await this.metrics.getMetricsForType(CPUMetric, start, end),
            await this.metrics.getMetricsForType(ReadMetric, start, end),
            await this.metrics.getMetricsForType(WriteMetric, start, end),
            memoryMetrics,
         ];

         const key = schema.metrics.getSingleSampleKey(this.asIChildProgram(), end);
         logger.info(`Saving metrics to ${key}`);
         await this.storage.writeJson(key, data);

      } catch (error) {
         if (firstTry) {
            logger.warn(`Failed to get metrics: ${error}`);
            logger.warn("Trying again...");
            this.sendMetricsToS3(start, end, false);

         } else {
            logger.error(`Failed to get metrics the second time: ${error}`);
            // TODO: mark capture as broken?

         }
      }
   }

}
