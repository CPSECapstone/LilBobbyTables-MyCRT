import { S3 } from 'aws-sdk';
import mysql = require('mysql');
import { setTimeout } from 'timers';

import { CaptureIpcNode, ICaptureIpcNodeDelegate, Logging } from '@lbt-mycrt/common';
import { MetricConfiguration } from '@lbt-mycrt/common/dist/metrics/metrics';
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

   public static updateCaptureStatus(id: number, status: string) {
      const config = require("../db/config.json");
      const conn = mysql.createConnection(config);

      return new Promise<any>((resolve, reject) => {
         conn.connect((connErr) => {
            if (connErr) {
               reject(connErr);
            } else {
               const updateStr = mysql.format("UPDATE Capture SET status = ? WHERE id = ?", [status, id]);
               conn.query(updateStr, async (updateErr, rows) => {
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

   public static updateCaptureStartTime(id: number) {
    const config = require("../db/config.json");
    const conn = mysql.createConnection(config);

    return new Promise<any>((resolve, reject) => {
       conn.connect((connErr) => {
          if (connErr) {
             reject(connErr);
          } else {
             const updateStr = mysql.format("UPDATE Capture SET start = NOW() WHERE id = ?", [id]);
             conn.query(updateStr, async (updateErr, rows) => {
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
    const config = require("../db/config.json");
    const conn = mysql.createConnection(config);

    return new Promise<any>((resolve, reject) => {
      conn.connect((connErr) => {
          if (connErr) {
            reject(connErr);
          } else {
            const updateStr = mysql.format("UPDATE Capture SET end = NOW() WHERE id = ?", [id]);
            conn.query(updateStr, async (updateErr, rows) => {
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
   private startTime: Date = new Date();
   private ipcNode: CaptureIpcNode;
   private metricConfig: MetricConfiguration;
   private storage: StorageBackend;
   private DEFAULT_INTERVAL: number = 5 * 1000;
   private DEFAULT_METRICS_OVERLAP: number = 1 * 60 * 1000;
   private DEFAULT_METRICS_INTERVAL: number = 5 * 60 * 1000;

   constructor(public config: ICaptureConfig) {
      this.ipcNode = new CaptureIpcNode(this.id, logger, this);
      this.storage = new S3Backend(new S3(), "lil-test-environment");
      this.metricConfig = new MetricConfiguration('DBInstanceIdentifier', 'nfl2015', 60, ['Maximum'], 'Percent');
   }

   public get id(): number {
      return this.config.id;
   }

   public run(): void {
      this.setup();
      if (this.config.supervised) {
         this.loop();
         setTimeout( () => { this.loopSend(this.startTime); },
                    this.config.sendMetricsInterval || this.DEFAULT_METRICS_INTERVAL );
      } else {
         this.teardown();
      }
   }

   public async onStop(): Promise<any> {
      logger.info(`Capture ${this.id} received stop signal!`);
      this.done = true;

      Capture.updateCaptureStatus(this.id, "dead");
      Capture.updateCaptureEndTime(this.id);
      const s3res = await stopRdsLoggingAndUploadToS3();
      return s3res;
   }

   private setup(): void {
      logger.info(`Performing setup for Capture ${this.id}`);
      this.ipcNode.start();

      logger.info(`Capture ${this.id}: startTime = ${this.startTime.toJSON()}`);
      Capture.updateCaptureStartTime(this.id);
      Capture.updateCaptureStatus(this.id, "live");

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

   private loopSend(startTime: Date): void {
     logger.info(`Capture ${this.id}: loopSend start`);

     if (this.done) {
       this.teardown();
     } else {
       this.sendMetricsToS3(this.storage, startTime);
       const nextTime = this.subMinutesFromDate(this.getEndTime(startTime),
                          this.config.metricsOverlap || this.DEFAULT_METRICS_OVERLAP);
       setTimeout(() => { this.loopSend(nextTime); },
                  this.config.sendMetricsInterval || this.DEFAULT_METRICS_INTERVAL);
     }
   }

   // pull metric from cloudwatch and send them to S3
   private async sendMetricsToS3(s3: StorageBackend, startTime: Date) {

     const baseKey = `capture${this.id}/depot/`;
     const endTime: Date = this.getEndTime(startTime);

     const CPUdata = await this.metricConfig.getCPUMetrics(startTime, endTime);
     s3.writeJson(`${baseKey}cpu-${endTime.toJSON()}.json`, CPUdata);

     const MEMdata = await this.metricConfig.getCPUMetrics(startTime, endTime);
     s3.writeJson(`${baseKey}memory-${endTime.toJSON()}.json`, MEMdata);

     const IOdata = await this.metricConfig.getCPUMetrics(startTime, endTime);
     s3.writeJson(`${baseKey}io-${endTime.toJSON()}.json`, IOdata);
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

   private teardown(): void {
      logger.info(`Performing teardown for Capture ${this.id}`);
      this.ipcNode.stop();
   }

}
