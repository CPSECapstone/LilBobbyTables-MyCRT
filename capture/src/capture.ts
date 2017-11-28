import { CaptureIpcNode, ICaptureIpcNodeDelegate, Logging } from '@lbt-mycrt/common';

const logger = Logging.defaultLogger(__dirname);

export interface ICaptureConfig {
   readonly id: number;
   readonly interval?: number;

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
      this.setup();
      this.loop();
   }

   public async onStop(): Promise<number> {
      logger.info(`Capture ${this.id} received stop signal!`);
      this.done = true;
      return this.id;
   }

   private setup(): void {
      logger.info(`Performing setup for Capture ${this.id}`);
      this.ipcNode.start();
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
