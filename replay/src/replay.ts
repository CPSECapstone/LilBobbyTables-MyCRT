import { IReplayIpcNodeDelegate, Logging, ReplayIpcNode } from '@lbt-mycrt/common';

const logger = Logging.defaultLogger(__dirname);

export interface IReplayConfig {
   readonly id: number;
   readonly interval?: number;
   readonly supervised?: boolean;
}

const DEFAULT_INTERVAL: number = 1000 * 5;

export class Replay implements IReplayIpcNodeDelegate {

   private done: boolean = false;
   private ipcNode: ReplayIpcNode;

   constructor(public config: IReplayConfig) {
      this.ipcNode = new ReplayIpcNode(this.id, logger, this);
   }

   public get id(): number {
      return this.config.id;
   }

   public run(): void {
      this.setup();
      this.loop();
   }

   private setup() {
      logger.info(`Replay ${this.id}: setup`);
      this.ipcNode.start();
   }

   private loop() {
      logger.info(`Replay ${this.id}: loop start`);

      if (this.done) {
         this.teardown();
      } else {
         this.done = true; // just one loop
         setTimeout(() => {
            this.loop();
         }, this.config.interval || DEFAULT_INTERVAL);
      }
   }

   private teardown() {
      logger.info(`Replay ${this.id}: teardown`);
      this.ipcNode.stop();
   }

}
