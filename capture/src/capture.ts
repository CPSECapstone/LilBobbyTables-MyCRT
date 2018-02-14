import mysql = require('mysql');
import { setTimeout } from 'timers';

import { CaptureIpcNode, ICaptureIpcNodeDelegate, IpcNode, Logging } from '@lbt-mycrt/common';
import { MetricsBackend } from '@lbt-mycrt/common';
import { Subprocess } from '@lbt-mycrt/common/dist/capture-replay/subprocess';
import { ChildProgramStatus, ChildProgramType, IChildProgram } from '@lbt-mycrt/common/dist/data';
import { MetricsStorage } from '@lbt-mycrt/common/dist/metrics/metrics-storage';
import { StorageBackend } from '@lbt-mycrt/common/dist/storage/backend';

import { CaptureConfig } from './args';
import { captureDao } from './dao';
import { startRdsLogging, stopRdsLoggingAndUploadToS3 } from './rds-logging';

const logger = Logging.defaultLogger(__dirname);

export class Capture extends Subprocess implements ICaptureIpcNodeDelegate {

   private ipcNode: IpcNode;

   constructor(public config: CaptureConfig, storage: StorageBackend, metrics: MetricsBackend) {
      super(storage, metrics);
      this.ipcNode = new CaptureIpcNode(this.id, logger, this);
   }

   get id(): number {
      return this.config.id;
   }

   get interval(): number {
      return this.config.interval;
   }

   public async onStop(): Promise<any> {
      logger.info(`Capture ${this.id} received stop signal!`);
      this.stop(true);
   }

   public asIChildProgram(): IChildProgram {
      return {
         id: this.id,
         type: ChildProgramType.CAPTURE,
         status: this.status,
         start: this.startTime || undefined,
      };
   }

   protected async setup(): Promise<void> {
      try {
         logger.info(`Performing setup for Capture ${this.id}`);

         logger.info(`Setting Capture ${this.id} status to 'starting'`);
         await captureDao.updateCaptureStatus(this.id, ChildProgramStatus.STARTING);

         logger.info(`Start ipc node`);
         await this.ipcNode.start();

         // TODO: abstract Rds communication and make synchronous
         if (!this.config.mock) {
            logger.info(`Starting RDS logging`);
            await startRdsLogging();
         }

         logger.info(`Setting Capture ${this.id} startTime = ${this.startTime!.toJSON()}`);
         await captureDao.updateCaptureStartTime(this.id);

         logger.info(`Setting Capture ${this.id} status to 'live'`);
         await captureDao.updateCaptureStatus(this.id, ChildProgramStatus.RUNNING);

      } catch (error) {
         logger.error(`Failed to setup capture: ${error}`);
         await captureDao.updateCaptureStatus(this.id, ChildProgramStatus.FAILED);
      }
   }

   protected loop(): void {
      logger.info('-----------==[ LOOP ]==-----------');

      const end = new Date();
      const start = new Date(end.getTime() - this.interval - this.config.intervalOverlap);
      if (start.getTime() < this.startTime!.getTime()) {
         start.setTime(this.startTime!.getTime());
      }

      logger.info('   process metrics...');
      this.sendMetricsToS3(start, end);
   }

   protected async teardown(): Promise<void> {
      try {
         logger.info(`Performing teardown for Capture ${this.id}`);
         logger.info("set status to 'stopping'");
         await captureDao.updateCaptureStatus(this.id, ChildProgramStatus.STOPPING);

         logger.info("record end time");
         await captureDao.updateCaptureEndTime(this.id);

         // TODO: abstract rds communication
         if (!this.config.mock) {
            logger.info("save workload");
            const s3res = await stopRdsLoggingAndUploadToS3();
            logger.info(`Got S3 location!: ${s3res}`);
         }

         logger.info('Stopping ipc node');
         await this.ipcNode.stop();

         logger.info("Setting status to 'done'");
         await captureDao.updateCaptureStatus(this.id, ChildProgramStatus.DONE);

      } catch (error) {
         logger.error(`teardown failed: ${error}`);
         await captureDao.updateCaptureStatus(this.id, ChildProgramStatus.FAILED);
      }
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
