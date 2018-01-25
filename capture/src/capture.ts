import { S3 } from 'aws-sdk';
import mysql = require('mysql');
import { setTimeout } from 'timers';

import { CaptureIpcNode, ICaptureIpcNodeDelegate, Logging } from '@lbt-mycrt/common';
import { ChildProgramStatus, ChildProgramType, IChildProgram } from '@lbt-mycrt/common/dist/data';
import { MetricConfiguration } from '@lbt-mycrt/common/dist/metrics/metrics';
import { MetricsBackend } from '@lbt-mycrt/common/dist/metrics/metrics-backend';
import { StorageBackend } from '@lbt-mycrt/common/dist/storage/backend';
import { S3Backend } from '@lbt-mycrt/common/dist/storage/s3-backend';

import { startRdsLogging, stopRdsLoggingAndUploadToS3 } from './rds-logging';

const logger = Logging.defaultLogger(__dirname);

// const metrics = {
//     Dimensions: [
//         {
//             Name: 'DBInstanceIdentifier', /* required */
//             Value: 'nfl2015', /* required */
//         },
//         /* more items */
//     ],
//     EndTime: new Date() || 'Mon Jan 14 2018 07:00:00 GMT-0800 (PST)' || 123456789, /* required */
//     // ExtendedStatistics: [
//     //     'STRING_VALUE',
//     // ],
//     MetricName: 'CPUUtilization', /* required */
//     Namespace: 'AWS/RDS', /* required */
//     Period: 60, /* required */
//     StartTime: new Date() || 'Mon Jan 14 2018 1:00:00 GMT-0800 (PST)' || 123456789, /* required */
//     Statistics: [
//         'Maximum',
//         // "CPUUtilization", || NetworkIn | NetworkOut | FreeableMemory,
//     ],
//     Unit: 'Percent',
//     // | Microseconds | Milliseconds | Bytes | Kilobytes | Megabytes |
//     //     Gigabytes | Terabytes | Bits | Kilobits | Megabits | Gigabits | Terabits |
//     //     Percent | Count | Bytes/Second | Kilobytes/Second | Megabytes/Second |
//     //     Gigabytes/Second | Terabytes/Second | Bits/Second | Kilobits/Second |
//     //     Megabits/Second | Gigabits/Second | Terabits/Second | Count/Second | None
// };

export interface ICaptureConfig {
   readonly id: number;
   readonly interval?: number;
   readonly sendMetricsInterval?: number;
   readonly metricsOverlap?: number;
   readonly supervised?: boolean;
   /* TODO: Remove question marks once the new info has been configured */
   readonly dbName?: string;
   readonly dbHost?: string;
   readonly dbUser?: string;
   readonly dbPass?: string;
   readonly s3Bucket?: string;
   readonly s3Key?: string;

   // other config stuff can be here...

}

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
   private readonly startTime: Date = new Date();
   private ipcNode: CaptureIpcNode;
   private metricConfig: MetricConfiguration;
   private storage: StorageBackend;
   private DEFAULT_INTERVAL: number = 5 * 1000;
   private DEFAULT_METRICS_OVERLAP: number = 1 * 60 * 1000;
   private DEFAULT_METRICS_INTERVAL: number = 5 * 60 * 1000;

   constructor(public config: ICaptureConfig) {
      this.ipcNode = new CaptureIpcNode(this.id, logger, this);
      this.storage = new S3Backend(new S3(), "lil-test-environment");
      this.metricConfig = new MetricConfiguration('DBInstanceIdentifier', 'nfl2015', 60, ['Maximum']);
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
      if (this.config.supervised) {
         logger.info(`Capture ${this.id} is looping!`);
         this.loop();
         // setTimeout( () => { this.loopSend(this.startTime); },
                  //   this.config.sendMetricsInterval || this.DEFAULT_METRICS_INTERVAL );
      } else {
         this.teardown();
      }
   }

   public async onStop(): Promise<any> {
      logger.info(`Capture ${this.id} received stop signal!`);
      this.done = true;

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
      return s3res;
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
      startRdsLogging();
   }

   private loop(): void {
      logger.info(`Capture ${this.id}: loop start`);

      if (this.done) {
         this.teardown();
      } else {
         setTimeout(() => { this.loop(); }, this.config.interval || this.DEFAULT_INTERVAL);
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

   private getEndTime(startTime: Date): Date {
      return this.addMinutesToDate(startTime, this.config.sendMetricsInterval
             || this.DEFAULT_METRICS_INTERVAL);
   }

   private addMinutesToDate(startDate: Date, minutes: number): Date {

      const millisecPerMin = 60000;
      return new Date(startDate.valueOf() + (minutes * millisecPerMin));
   }

   private subMinutesFromDate(startDate: Date, minutes: number): Date {

    const millisecPerMin = 60000;
    return new Date(startDate.valueOf() - (minutes * millisecPerMin));
  }

   private async teardown() {
      logger.info(`Performing teardown for Capture ${this.id}`);

      await this.sendMetricsToS3(this.storage, this.startTime, new Date());

      this.ipcNode.stop();
   }

}
