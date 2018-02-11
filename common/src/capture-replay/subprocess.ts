import { ChildProgramStatus, IChildProgram } from '../data';
import { IpcNode } from '../ipc/ipc-node';
import { MetricsBackend } from '../metrics/metrics-backend';
import { StorageBackend } from '../storage/backend';

export abstract class Subprocess {

   protected startTime: Date | null = null;
   protected status: ChildProgramStatus = ChildProgramStatus.STARTING;
   private loopTimeoutId: NodeJS.Timer | null = null;
   private isDone: boolean = false;

   constructor(protected storage: StorageBackend, protected metrics: MetricsBackend) {

   }

   public run(): void {
      this.startTime = new Date();
      this.setup();
      this.loopTimeoutId = setInterval(() => {
         this.runLoop();
      }, this.interval);
   }

   public stop(extraLoop: boolean): void {
      this.isDone = true;
      clearInterval(this.loopTimeoutId!);
      if (extraLoop) {
         this.loop();
      }
      this.teardown();
   }

   public abstract asIChildProgram(): IChildProgram;

   abstract get id(): number;
   public get done(): boolean {
      return this.isDone;
   }
   abstract get interval(): number;

   protected abstract async setup(): Promise<void>;
   protected abstract loop(): void;
   protected abstract async teardown(): Promise<void>;

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
