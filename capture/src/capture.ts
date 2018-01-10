import { CaptureIpcNode, ICaptureIpcNodeDelegate, Logging } from '@lbt-mycrt/common';

import { startRdsLogging, stopRdsLoggingAndUploadToS3 } from './rds-logging';

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
   private done: boolean = false;

   private ipcNode: CaptureIpcNode;

   constructor(public config: ICaptureConfig) {
      this.ipcNode = new CaptureIpcNode(this.id, logger, this);
   }

   public get id(): number {
      return this.config.id;
   }

   public run(): void {
      if (this.config.supervised) {
         this.setup();
         this.loop();
      } else {
         this.setup();
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
