import { ChildProgramStatus, IChildProgram } from '../data';
import { IpcNode } from '../ipc/ipc-node';
import { MetricConfiguration } from '../metrics/metrics';
import { StorageBackend } from '../storage/backend';

export abstract class Subprocess {

   protected startTime: Date | null = null;
   protected status: ChildProgramStatus = ChildProgramStatus.STARTING;
   private loopTimeoutId: NodeJS.Timer | null = null;
   private isDone: boolean = false;

   constructor(protected storage: StorageBackend, protected metrics: MetricConfiguration) {

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

}
