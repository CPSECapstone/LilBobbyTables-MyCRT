import { ChildProgramType, ICaptureIpcNodeDelegate, IChildProgram, Logging, MetricsBackend } from '@lbt-mycrt/common';
import { StorageBackend } from '@lbt-mycrt/common/dist/storage/backend';

import { Capture } from '../capture';
import { MimicConfig } from './args';

const logger = Logging.defaultLogger(__dirname);

/**
 * The Mimic Process is a capture that can also simulaneously replay the workload on multiple
 * target databases. This generates on "Capture" and one or more "Replays".
 */
export class Mimic extends Capture implements ICaptureIpcNodeDelegate {

   get nameId(): string {
      return `mimic ${this.id}`;
   }

   public asIChildProgram(): IChildProgram {
      return {
         ...super.asIChildProgram(),
         type: ChildProgramType.MIMIC,
      };
   }

   /** Handle the stop signal */
   public async onStop(): Promise<any> {
      logger.info(`Mimic ${this.id} received stop signal!`);
      this.stop(true);
   }

   protected async setup(): Promise<void> {
      await super.setup();
      try {

         // TODO: setup for mimic
         logger.info(`Performing setup for Mimic ${this.id}`);

      } catch (error) {
         this.selfDestruct(`Failed to setup mimic ${error}`);
      }
   }

   protected async loop(): Promise<void> {
      await super.loop();

      // TODO: loop for mimic

   }

   protected async teardown(): Promise<void> {
      await super.teardown();
      try {

         // TODO: teardown for mimic
         logger.info(`Performing teardown for mimic ${this.id}`);

      } catch (error) {
         this.selfDestruct(`mimic teardown failed: ${error}`);
      }
   }

   protected async dontPanic(reason: string): Promise<void> {
      await super.dontPanic(reason);

      // TODO: extra stuff for mimic

      // if the capture fails, they all fail
      // if a replay fails, only that replay should be marked as failed

   }

}
