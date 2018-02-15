import mysql = require('mysql');

import { IpcNode, IReplayIpcNodeDelegate, Logging, ReplayDao, ReplayIpcNode } from '@lbt-mycrt/common';
import { MetricsBackend } from '@lbt-mycrt/common';
import { Subprocess } from '@lbt-mycrt/common/dist/capture-replay/subprocess';
import { ChildProgramStatus, ChildProgramType, IChildProgram } from '@lbt-mycrt/common/dist/data';
import { MetricsStorage } from '@lbt-mycrt/common/dist/metrics/metrics-storage';
import { StorageBackend } from '@lbt-mycrt/common/dist/storage/backend';

import { ReplayConfig } from './args';
import { replayDao } from './dao';

const logger = Logging.defaultLogger(__dirname);

export class Replay extends Subprocess implements IReplayIpcNodeDelegate {

   public static getWorkloadForCapture(id: number) {
      // return Replay.queryDatabase("SELECT workload from Capture WHERE id = ?", [id]);
      // this is hardcoded for now
      return "nfllogbucket/mylog.json";
   }

   private ipcNode: IpcNode;
   private workloadLocation?: string;
   private workload?: [any];
   private workloadIndex: number = 0;
   private error: boolean = false;
   private DEFAULT_INTERVAL: number = 5 * 1000;
   private DEFAULT_METRICS_OVERLAP: number = 1 * 60 * 1000;
   private DEFAULT_METRICS_INTERVAL: number = 5 * 60 * 1000;

   constructor(public config: ReplayConfig, storage: StorageBackend, metrics: MetricsBackend) {
      super(storage, metrics);
      this.ipcNode = new ReplayIpcNode(this.id, logger, this);
   }

   get id(): number {
      return this.config.id;
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
         logger.info(`Setting Replay ${this.id} startTime = ${this.startTime!.toJSON()}...`);
         await replayDao.updateReplayStartTime(this.id);

         logger.info(`Setting Replay ${this.id} status to 'live'`);
         await replayDao.updateReplayStatus(this.id, ChildProgramStatus.STARTING);

         logger.info(`Replay ${this.id}: setup`);
         this.ipcNode.start();

         await this.getWorkload();

         await replayDao.updateReplayStatus(this.id, ChildProgramStatus.RUNNING);

      } catch (error) {
         logger.error(`Failed to setup Replay: ${error}`);
         await replayDao.updateReplayStatus(this.id, ChildProgramStatus.FAILED);
      }
   }

   protected loop(): void {
      logger.info(`Replay ${this.id}: loop`);

      let finished = true;
      const thisLoopStart = Date.now();
      const nextLoopStart = thisLoopStart.valueOf() + this.interval;

      // && this.queryInInterval(this.workloadIndex, nextLoopStart)
      while (this.workloadIndex < this.workload!.length ) {

         const delay = this.getDelayForIndex(this.workloadIndex, thisLoopStart);
         const currentIndex = this.workloadIndex;
         const currentQuery = this.workload![currentIndex];

         setTimeout(() => {
          this.processQuery(currentQuery.command_type, currentQuery.argument); }, delay);

         // don't let the subprocess end because we still need to run these queries.
         finished = false;
         this.workloadIndex += 1;
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

      this.ipcNode.stop();
   }

   private async getWorkload() {

      logger.info(`Getting workload from storage`);
      this.workloadLocation = await Replay.getWorkloadForCapture(this.config.captureId);
      this.workload = await this.storage.readJson(this.workloadLocation) as any;
   }

   // queryInInterval takes the index of the query in the workload and the time
   //                 that next loop will begin in milliseconds and returns true
   //                 if the query should be scheduled for the current loop otherwise false.
   private queryInInterval(index: number, intervalStartTime: number): boolean {

      const delay = this.getDelayForIndex(index, intervalStartTime);
      return (delay >= 0 && delay < this.interval) ? true : false  ;
   }

   // getDelayForIndex takes in an index and the current interval's start time and returns the
   //                  number of milliseconds to delay from the interval's start time.
   private getDelayForIndex(index: number, intervalStartTime: number): number {
      if (this.workload == null) {
         return 0;
      } else if (index > 0 && index < this.workload!.length) {
         const queryStartTime: Date = new Date(this.workload![index].event_time);
         const workloadStartTime: Date = new Date(this.workload![0].event_time);
         const relativeQueryST = queryStartTime.getTime() - workloadStartTime.getTime() + this.startTime!.getTime();
         const delay = relativeQueryST - intervalStartTime + (Date.now() - intervalStartTime);

         return delay;
      } else {
         return 0;
      }
   }

   private processQuery(type: any, argument: any) {

      if (type === "Query") {

        const remoteReplayDbConfig = require('../db/remoteReplayConfig.json');
        const conn = mysql.createConnection(remoteReplayDbConfig);

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

         const key = MetricsStorage.getSingleSampleMetricsKey(this.asIChildProgram(), end);
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
