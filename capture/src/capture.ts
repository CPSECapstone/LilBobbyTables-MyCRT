import mysql = require('mysql');
import { setTimeout } from 'timers';

import { CaptureIpcNode, ICaptureIpcNodeDelegate, IpcNode, Logging } from '@lbt-mycrt/common';
import { Subprocess } from '@lbt-mycrt/common/dist/capture-replay/subprocess';
import { ChildProgramStatus, ChildProgramType, IChildProgram } from '@lbt-mycrt/common/dist/data';
import { MetricConfiguration } from '@lbt-mycrt/common/dist/metrics/metrics';
import { MetricsBackend } from '@lbt-mycrt/common/dist/metrics/metrics-backend';
import { StorageBackend } from '@lbt-mycrt/common/dist/storage/backend';

import { CaptureConfig } from './args';
import { startRdsLogging, stopRdsLoggingAndUploadToS3 } from './rds-logging';

const logger = Logging.defaultLogger(__dirname);

export class Capture extends Subprocess implements ICaptureIpcNodeDelegate {

   public static updateCaptureStatus(id: number, status: string): Promise<any> {
      const localDbConfig = require('../db/config.json');
      const conn = mysql.createConnection(localDbConfig);

      return new Promise<any>((resolve, reject) => {
         conn.connect((connErr) => {
            if (connErr) {
               reject(connErr);
            } else {
               const updateStr = mysql.format("UPDATE Capture SET status = ? WHERE id = ?", [status, id]);
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

   public static updateCaptureStartTime(id: number): Promise<any> {
      const localDbConfig = require('../db/config.json');
      const conn = mysql.createConnection(localDbConfig);

      return new Promise<any>((resolve, reject) => {
         conn.connect((connErr) => {
            if (connErr) {
               reject(connErr);
            } else {
               const updateStr = mysql.format("UPDATE Capture SET start = NOW() WHERE id = ?", [id]);
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

   public static updateCaptureEndTime(id: number) {
      const localDbConfig = require('../db/config.json');
      const conn = mysql.createConnection(localDbConfig);

      return new Promise<any>((resolve, reject) => {
         conn.connect((connErr) => {
            if (connErr) {
               reject(connErr);
            } else {
               const updateStr = mysql.format("UPDATE Capture SET end = NOW() WHERE id = ?", [id]);
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

   private ipcNode: IpcNode;

   constructor(public config: CaptureConfig, storage: StorageBackend, metrics: MetricConfiguration) {
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
         this.ipcNode.start();

         logger.info(`Setting Capture ${this.id} startTime = ${this.startTime!.toJSON()}`);
         await Capture.updateCaptureStartTime(this.id);

         logger.info(`Setting Capture ${this.id} status to 'live'`);
         await Capture.updateCaptureStatus(this.id, "live");

         logger.info(`Starting RDS logging`);
         // TODO: abstract Rds communication
         if (!this.config.mock) {
            startRdsLogging();
         }
      } catch (error) {
         logger.error(`Failed to setup capture: ${error}`);
      }
   }

   protected loop(): void {
      logger.info(`Capture ${this.id}: loop start`);
   }

   protected async teardown(): Promise<void> {
      logger.info(`Performing teardown for Capture ${this.id}`);

      logger.info("set status to dead");
      await Capture.updateCaptureStatus(this.id, "dead").catch((reason) => {
         logger.error(`Failed to set status to dead: ${reason}`);
      });

      logger.info("record end time");
      await Capture.updateCaptureEndTime(this.id).catch((reason) => {
         logger.error(`Failed to record end time: ${reason}`);
      });

      logger.info("save workload");
      const s3res = await stopRdsLoggingAndUploadToS3().catch((reason) => {
         logger.error(`Failed to upload RDS log to S3: ${reason}`);
      });
      logger.info(`Got S3 location!: ${s3res}`);

      await this.sendMetricsToS3(this.storage, this.startTime!, new Date());

      this.ipcNode.stop();
   }

   // private loopSend(startTime: Date): void {
   //   logger.info(`Capture ${this.id}: loopSend start`);

   //   if (this.done) {
   //     this.teardown();
   //   } else {
   //     this.sendMetricsToS3(this.storage, startTime);
   //     const nextTime = this.subMinutesFromDate(this.getEndTime(startTime),
   //                        this.config.metricsOverlap || this.DEFAULT_METRICS_OVERLAP);
   //     setTimeout(() => { this.loopSend(nextTime); },
   //                this.config.sendMetricsInterval || this.DEFAULT_METRICS_INTERVAL);
   //   }
   // }

   // pull metric from cloudwatch and send them to S3
   private async sendMetricsToS3(s3: StorageBackend, startTime: Date, endTime: Date) {
      // TODO: handle properly after metrics are using DI
      if (this.config.mock) {
         logger.warn("MOCK MODE: not sending metrics");
         return;
      }

      logger.info("Retrieving metrics");
      const CPUdata = await this.metrics.getCPUMetrics(startTime, endTime);
      const MEMdata = await this.metrics.getMemoryMetrics(startTime, endTime);
      const IOdata = await this.metrics.getIOMetrics(startTime, endTime);
      const allData = [CPUdata, MEMdata, IOdata];

      const baseKey = MetricsBackend.getDoneMetricsKey(this.asIChildProgram());
      logger.info(`Saving metrics to ${baseKey}`);
      await s3.writeJson(baseKey, allData).catch((reason) => {
         logger.error(`Could not save metrics: ${reason}`);
      });
   }

   // private getEndTime(startTime: Date): Date {
   //    return this.addMinutesToDate(startTime, this.config.interval);
   // }

   // private addMinutesToDate(startDate: Date, minutes: number): Date {

   //    const millisecPerMin = 60000;
   //    return new Date(startDate.valueOf() + (minutes * millisecPerMin));
   // }

   // private subMinutesFromDate(startDate: Date, minutes: number): Date {

   //    const millisecPerMin = 60000;
   //    return new Date(startDate.valueOf() - (minutes * millisecPerMin));
   // }

}
