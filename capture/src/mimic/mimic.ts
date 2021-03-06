import { ChildProgramStatus, ChildProgramType, ICapture, ICaptureIpcNodeDelegate, IChildProgram,
   IEnvironmentFull, IWorkload, Logging, MetricsBackend} from '@lbt-mycrt/common';
import { StorageBackend } from '@lbt-mycrt/common/dist/storage/backend';

import { Capture } from '../capture';
import { WorkloadLogger } from '../workload/workload-logger';
import { MimicConfig } from './args';
import { replayDao } from './dao';
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

   protected async setup(): Promise<void> {
      await super.setup();
      try {
         logger.info(`Performing setup for Mimic ${this.id}`);

         logger.info(`Loading Replay Information for ids ${this.config.replayIds}`);
         for (const id of this.config.replayIds) {
            const replay = new ReplayManager(id, this.config, this.storage, this.metrics);
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
      let first: boolean = false;
      for (const replay of this.replays) {
         if (!replay.hasStarted) {
            first = true;
            await replay.start();
         }
      }

      // process the workload
      const capture: ICapture = {
         type: ChildProgramType.CAPTURE,
         start: this.startTime!,
      };
      for (const replay of this.replays) {
         await replay.processWorkloadFragment(capture, workloadFragment);
      }

      // get metrics for the replays
      if (!first) {
         this.replays.forEach((r) => r.retrieveMetrics());
      }

      return workloadFragment;
   }

   protected async teardown(): Promise<void> {
      await super.teardown();
      try {
         logger.info(`Performing teardown for mimic ${this.id}`);

         logger.info(`Waiting for all replays to finish`);
         await Promise.all(this.replays.map((r) => r.finishAllCommands()));

         logger.info(`Setting replay statuses to STOPPING`);
         for (const replay of this.replays) {
            await replayDao.updateReplayStatus(replay.id, ChildProgramStatus.STOPPING);
         }

         logger.info(`Getting the last metrics for the replays`);
         this.replays.forEach((r) => r.retrieveMetrics());

         logger.info(`Waiting for all metrics...`);
         await Promise.all(this.replays.map((r) => r.finishAllMetrics()));

         setTimeout(async () => {
            logger.info(`Preparing final metrics files`);
            for (const replay of this.replays) {
               await replay.prepareFinalMetricsFile();
            }

            logger.info(`Ending replays`);
            for (const replay of this.replays) {
               await replay.end();
            }

            logger.info(`Done!`);
         }, this.config.filePrepDelay);

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
