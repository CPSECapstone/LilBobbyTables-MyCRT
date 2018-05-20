import { ChildProgramType, ICaptureIpcNodeDelegate, IChildProgram, IEnvironmentFull, IWorkload,
   Logging, MetricsBackend} from '@lbt-mycrt/common';
import { StorageBackend } from '@lbt-mycrt/common/dist/storage/backend';

import { Capture } from '../capture';
import { WorkloadLogger } from '../workload/workload-logger';
import { MimicConfig } from './args';
import { ReplayManager } from './replay-manager';

const logger = Logging.defaultLogger(__dirname);

/**
 * The Mimic Process is a capture that can also simulaneously replay the workload on multiple
 * target databases. This generates on "Capture" and one or more "Replays".
 */
export class Mimic extends Capture implements ICaptureIpcNodeDelegate {

   private replays: ReplayManager[] = [];

   constructor(public config: MimicConfig, workloadLogger: WorkloadLogger, storage: StorageBackend,
         metrics: MetricsBackend, env: IEnvironmentFull) {
      super(config, workloadLogger, storage, metrics, env);
   }

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
         logger.info(`Performing setup for Mimic ${this.id}`);

         logger.info(`Loading Replay Information for ids ${this.config.replayIds}`);
         for (const id of this.config.replayIds) {
            const replay = new ReplayManager(id);
            const loaded = await replay.loadReplay();
            if (loaded) {
               this.replays.push(replay);
            } else {
               try {
                  replay.dontPanic("Failed to load");
               } catch {}
            }
         }
         if (this.replays.length <= 0) {
            this.selfDestruct(`Failed to load any replays`);
         }

      } catch (error) {
         this.selfDestruct(`Failed to setup mimic ${error}`);
      }
   }

   protected async loop(): Promise<IWorkload> {
      const workloadFragment: IWorkload = await super.loop();

      // start the replay models
      for (const replay of this.replays) {
         if (!replay.hasStarted) {
            await replay.start();
         }
      }

      for (const replay of this.replays) {
         await replay.processWorkloadFragment(workloadFragment);
      }

      return workloadFragment;
   }

   protected async teardown(): Promise<void> {
      await super.teardown();
      try {
         logger.info(`Performing teardown for mimic ${this.id}`);

         logger.info(`Waiting for all replays to finish`);
         await Promise.all(this.replays.map((r) => r.finishAllCommands()));

         for (const replay of this.replays) {
            await replay.end();
         }

      } catch (error) {
         this.selfDestruct(`mimic teardown failed: ${error}`);
      }
   }

   protected async dontPanic(reason: string): Promise<void> {
      await super.dontPanic(reason);
      for (const replay of this.replays) {
         await replay.dontPanic(`Capture failed while mimicking: ${reason}`);
      }
   }

}
