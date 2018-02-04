import { IReplayIpcNodeDelegate, Logging, MetricsBackend, ReplayIpcNode } from '@lbt-mycrt/common';
import { Subprocess } from '@lbt-mycrt/common/dist/capture-replay/subprocess';
import { ChildProgramType, IChildProgram } from '@lbt-mycrt/common/dist/data';
import { StorageBackend } from '@lbt-mycrt/common/dist/storage/backend';

import { ReplayConfig } from './args';

const logger = Logging.defaultLogger(__dirname);

export class Replay extends Subprocess implements IReplayIpcNodeDelegate {

   private ipcNode: ReplayIpcNode;

   constructor(public config: ReplayConfig, storage: StorageBackend, metrics: MetricsBackend) {
      super(storage, metrics);
      this.ipcNode = new ReplayIpcNode(this.id, logger, this);
   }

   get id(): number {
      return this.config.id;
   }

   get interval(): number {
      return this.config.interval;
   }

   public asIChildProgram(): IChildProgram {
      return {
         id: this.id,
         type: ChildProgramType.REPLAY,
         status: this.status,
         start: this.startTime || undefined,
      };
   }

   protected async setup(): Promise<void> {
      logger.info(`Replay ${this.id}: setup`);
      this.ipcNode.start();
   }

   protected loop(): void {
      logger.info(`Replay ${this.id}: loop`);
      this.stop(false); // just once for now
   }

   protected async teardown(): Promise<void> {
      this.ipcNode.stop();
   }

}
