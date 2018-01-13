import { CaptureIpcNode, ICaptureIpcNodeDelegate, Logging } from '@lbt-mycrt/common';

import { startRdsLogging, stopRdsLoggingAndUploadToS3 } from './rds-logging';

import mysql = require('mysql');

const logger = Logging.defaultLogger(__dirname);

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
      logger.info(`Capture ${this.id} received stop signal!`);
      this.done = true;

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
