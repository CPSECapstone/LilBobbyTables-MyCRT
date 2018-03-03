import mysql = require('mysql');

import { ICapture, IpcNode, IReplayIpcNodeDelegate, Logging } from '@lbt-mycrt/common';
import { mycrtDbConfig, ReplayDao, ReplayIpcNode } from '@lbt-mycrt/common';
import { MetricsBackend } from '@lbt-mycrt/common';
import { Subprocess } from '@lbt-mycrt/common/dist/capture-replay/subprocess';
import { ChildProgramStatus, ChildProgramType, IChildProgram, IDbReference } from '@lbt-mycrt/common/dist/data';
import { MetricsStorage } from '@lbt-mycrt/common/dist/metrics/metrics-storage';
import { StorageBackend } from '@lbt-mycrt/common/dist/storage/backend';
import { path as schema } from '@lbt-mycrt/common/dist/storage/backend-schema';

import { ReplayConfig } from './args';
import { captureDao, replayDao } from './dao';

const logger = Logging.defaultLogger(__dirname);

export class Replay extends Subprocess implements IReplayIpcNodeDelegate {

   private ipcNode: IpcNode;
   private capture?: ICapture | null;
   private expectedEndTime?: Date;
   private targetDb: IDbReference;
   private workload?: [any];
   private workloadPath?: string;
   private workloadIndex: number = 0;
   private error: boolean = false;

   private zoneOffset = {

    'us-east-2': -3 * 60 * 60 * 1000,
    'us-west-1': -8 * 60 * 60 * 1000,

   };

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

      if (this.expectedEndTime === undefined) {
        return this.config.interval;
      }

      // I need to rethink this.... using this replays will get stuck part way through.
      // const timeToEnd = this.expectedEndTime!.getTime() - Date.now();
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
         logger.info(`Setting Replay ${this.id} startTime = ${this.startTime!.toJSON()}...`);
         await replayDao.updateReplayStartTime(this.id);

         logger.info(`Setting Replay ${this.id} status to 'live'`);
         await replayDao.updateReplayStatus(this.id, ChildProgramStatus.STARTING);

         logger.info(`Replay ${this.id}: setup`);
         this.ipcNode.start();

         this.capture = await captureDao.getCapture(this.config.captureId);
         // tslint:disable-next-line:max-line-length
         this.expectedEndTime =  new Date(this.capture!.end!.getTime() - this.capture!.start!.getTime() + this.startTime!.getTime());
         logger.info(`ExpectedEndTime: ${this.expectedEndTime}`);
         await this.getWorkload();

         await replayDao.updateReplayStatus(this.id, ChildProgramStatus.RUNNING);

      } catch (error) {
         this.selfDestruct(error);
      }
   }

   protected loop(): void {
      logger.info(`Replay ${this.id}: loop`);

      let finished = true;

      while (this.workloadIndex < this.workload!.length && this.queryInInterval(this.workloadIndex)) {

         const delay = this.getDelayForIndex(this.workloadIndex);
         const currentIndex = this.workloadIndex;
         const currentQuery = this.workload![currentIndex];

         setTimeout(() => {
          this.processQuery(currentQuery.command_type, currentQuery.argument); }, delay);
         logger.info(`Scheduled query: ${this.workloadIndex}`);

         // don't let the subprocess end because we still need to run these queries.
         finished = false;
         this.workloadIndex += 1;
      }

      if (this.workloadIndex < this.workload!.length || Date.now() < this.expectedEndTime!.getTime()) {
        // don't let the subprocess end because we still have queries to que.
        finished = false;
      }

      const end = new Date();
      const start = new Date(end.getTime() - this.interval - this.config.intervalOverlap);
      if (start.getTime() < this.startTime!.getTime()) {
         start.setTime(this.startTime!.getTime());
      }
      this.sendMetricsToS3(start, end);

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

   private getCaptureWorkloadPath(id: number): string {

    if (!this.config.mock) {
      return `${this.storage.rootDirectory()}/capture${id}/workload.json`;
    } else {
      return `capture${id}/workload.json`;
    }
  }

   private async getWorkload() {

      logger.info(`Getting workload from storage`);
      this.workloadPath = this.getCaptureWorkloadPath(this.config.captureId);
      this.workload = await this.storage.readJson(this.workloadPath) as any;
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
      } else if (index >= 0 && index < this.workload!.length) {

         const queryStart: Date = new Date(this.workload![index].event_time);
         const captureStart: Date = this.capture!.start!;
         const replayStart = this.startTime!;

         // tslint:disable-next-line:max-line-length
         const delay = (queryStart.getTime() - captureStart.getTime()) - (Date.now().valueOf() - replayStart.getTime());

         return delay;
      } else {
         return 0;
      }
   }

   private processQuery(type: any, argument: any) {
      // This may cause errors because targetDb is of type IDbReference
      // which has more fields than what mysql.createConnection takes
      const db = this.config.mock ? mycrtDbConfig : this.targetDb;
      if (type === "Query") {

        const conn = mysql.createConnection(db);

        return new Promise<any>((resolve, reject) => {
          conn.connect((connErr) => {
              if (connErr) {
                reject(connErr);
              } else {
                const updateStr = mysql.format(argument, []);
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
   private async sendMetricsToS3(start: Date, end: Date, firstTry: boolean = true) {
      try {

         const data = [
            await this.metrics.getCPUMetrics(start, end),
            await this.metrics.getReadMetrics(start, end),
            await this.metrics.getWriteMetrics(start, end),
            await this.metrics.getMemoryMetrics(start, end),
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
