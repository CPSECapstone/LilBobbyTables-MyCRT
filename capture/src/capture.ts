import { CloudWatch, S3 } from 'aws-sdk';

import mysql = require('mysql');
import { setTimeout } from 'timers';

import { CaptureIpcNode, ICaptureIpcNodeDelegate, Logging } from '@lbt-mycrt/common';
import { ChildProgramStatus, ChildProgramType, IChildProgram } from '@lbt-mycrt/common/dist/data';
import { MetricConfiguration } from '@lbt-mycrt/common/dist/metrics/metrics';
import { MetricsBackend } from '@lbt-mycrt/common/dist/metrics/metrics-backend';
import { StorageBackend } from '@lbt-mycrt/common/dist/storage/backend';

import { CaptureConfig } from './args';
import { startRdsLogging, stopRdsLoggingAndUploadToS3 } from './rds-logging';

const logger = Logging.defaultLogger(__dirname);

export class Capture implements ICaptureIpcNodeDelegate {

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

   private done: boolean = false;
   private loopTimeoutId: NodeJS.Timer | null = null;
   private readonly startTime: Date = new Date();

   private ipcNode: CaptureIpcNode;
   private metricConfig: MetricConfiguration;
   private cloudwatch: CloudWatch;
   private storage: StorageBackend;

   constructor(public config: CaptureConfig, storage: StorageBackend) {
      this.ipcNode = new CaptureIpcNode(this.id, logger, this);
      this.storage = storage;
      this.cloudwatch = new CloudWatch({ region: 'us-east-2' });
      this.metricConfig = new MetricConfiguration(this.cloudwatch, 'DBInstanceIdentifier', 'nfl2015', 60, ['Maximum']);

   }

   public get id(): number {
      return this.config.id;
   }

   public asIChildProgram(): IChildProgram {
      return {
         type: ChildProgramType.CAPTURE,
         id: this.id,
         name: "",
         start: this.startTime.toJSON(),
         end: null,
         status: ChildProgramStatus.DEAD,
      };
   }

   public run(): void {
      this.setup();
      if (!this.config.supervised) {
         throw new Error("unsupervised capture mode has not been implemented yet!");
      }
      logger.info(`Capture ${this.id} is looping!`);
      this.loopTimeoutId = setInterval(() => {
         this.loop();
      }, this.config.interval);
   }

   public async onStop(): Promise<any> {
      logger.info(`Capture ${this.id} received stop signal!`);
      this.done = true;
      this.loop();
   }

   private async setup(): Promise<void> {
      logger.info(`Performing setup for Capture ${this.id}`);
      this.ipcNode.start();

      logger.info(`Setting Capture ${this.id} startTime = ${this.startTime.toJSON()} . . . `);
      await Capture.updateCaptureStartTime(this.id).catch((reason) => {
         logger.error(`Failed to update start time: ${reason}`);
      });
      logger.info(`Setting Capture ${this.id} status to 'live'`);
      await Capture.updateCaptureStatus(this.id, "live").catch((reason) => {
         logger.error(`Failed to update status: ${reason}`);
      });

      logger.info(`Starting RDS logging`);
      // TODO: abstract Rds communication
      if (!this.config.mock) {
         startRdsLogging();
      }
   }

   private loop(): void {
      logger.info(`Capture ${this.id}: loop start`);

      if (this.done) {
         clearInterval(this.loopTimeoutId!);
         this.teardown();
      }
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
      const CPUdata = await this.metricConfig.getCPUMetrics(startTime, endTime);
      const MEMdata = await this.metricConfig.getMemoryMetrics(startTime, endTime);
      const IOdata = await this.metricConfig.getIOMetrics(startTime, endTime);
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

   private async teardown() {
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

      await this.sendMetricsToS3(this.storage, this.startTime, new Date());

      this.ipcNode.stop();
   }

}
