import { defaultLogger } from '../logging';

import { ChildProgramStatus, IChildProgram } from '../data';
import { IpcNode } from '../ipc/ipc-node';
import { MetricsBackend } from '../metrics/metrics-backend';
import { StorageBackend } from '../storage/backend';

const logger = defaultLogger(__dirname);

export abstract class Subprocess {

   protected startTime: Date | null = null;
   protected endTime: Date | null = null;
   protected status: ChildProgramStatus = ChildProgramStatus.STARTING;
   private loopTimeoutId: NodeJS.Timer | null = null;
   private isDone: boolean = false;

   constructor(protected storage: StorageBackend, protected metrics: MetricsBackend) {}

   public run(): void {
      this.setup();
      this.loopTimeoutId = setInterval(() => {
         this.runLoop();
      }, this.interval);
   }

   public async stop(extraLoop: boolean) {
      this.isDone = true;
      clearInterval(this.loopTimeoutId!);
      if (extraLoop) {
         await this.loop();
      }
      await this.teardown();
   }

   public abstract asIChildProgram(): IChildProgram;

   abstract get id(): number;
   abstract get nameId(): string;
   public get done(): boolean {
      return this.isDone;
   }
   abstract get interval(): number;

   protected abstract async setup(): Promise<void>;
   protected abstract async loop(): Promise<void>;
   protected abstract async teardown(): Promise<void>;
   protected abstract async dontPanic(): Promise<void>;

   protected async tryTwice(action: () => Promise<void>, desc: string, firstTry: boolean = true) {
      try {
         await action();
      } catch (error) {
         if (firstTry) {
            logger.warn(`Failed to ${desc}: ${error}`);
            logger.warn(`Trying again...`);
            this.tryTwice(action, desc, false);
         } else {
            logger.error(`Failed to ${desc} the second time: ${error}`);
            // TODO: handle?
         }
      }
   }

   protected async selfDestruct(reason: string) {
      try {
         logger.info('so long and thanks for all the fish');
         logger.error(reason);
         await this.dontPanic();
      } catch (error) {
         try {
            logger.error(`${this.nameId} failed to self destruct properly`);
         } catch (error) {
            // logging is broken
            process.exit(2);
         }
      }
      process.exit(42);
   }

   private runLoop(): void {
      this.loop();
   }

   private getUptime() {
      if (this.startTime == null) {
         return 0;
      } else {
         return Date.now() - this.startTime.getTime();
      }
   }
}
