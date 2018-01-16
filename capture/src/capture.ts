import { CaptureIpcNode, getMetrics, ICaptureIpcNodeDelegate, Logging } from '@lbt-mycrt/common';

import { startRdsLogging, stopRdsLoggingAndUploadToS3 } from './rds-logging';

import mysql = require('mysql');

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

   private done: boolean = false;

   private ipcNode: CaptureIpcNode;

   constructor(public config: ICaptureConfig) {
      this.ipcNode = new CaptureIpcNode(this.id, logger, this);
   }

   public get id(): number {
      return this.config.id;
   }

   public run(): void {
      this.setup();
      if (this.config.supervised) {
         this.loop();
      } else {
         this.teardown();
      }
   }

   public async onStop(): Promise<any> {
    //   getMetrics(metrics);

      logger.info(`Capture ${this.id} received stop signal!`);
      this.done = true;

      Capture.updateCaptureStatus(this.id, "dead");
      const s3res = await stopRdsLoggingAndUploadToS3();
      return s3res;
   }

   private setup(): void {
      logger.info(`Performing setup for Capture ${this.id}`);
      this.ipcNode.start();

      Capture.updateCaptureStatus(this.id, "live");
      logger.info(`Starting RDS logging`);
      startRdsLogging();
   }

   private loop(): void {
      logger.info(`Capture ${this.id}: loop start`);

      if (this.done) {
         this.teardown();
      } else {
         setTimeout(() => { this.loop(); }, this.config.interval);
      }
   }

   private teardown(): void {
      logger.info(`Performing teardown for Capture ${this.id}`);
      this.ipcNode.stop();
   }

}
