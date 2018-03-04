import { ChildProgramType, ICommand, IWorkload } from '@lbt-mycrt/common';
import { StorageBackend } from '@lbt-mycrt/common/dist/storage/backend';

export abstract class WorkloadLogger {

   protected logging: boolean = false;

   constructor(public readonly type: ChildProgramType, public readonly id: number, protected storage: StorageBackend) {}

   public get isLogging() {
      return this.logging;
   }

   public async getWorkloadFragment(start: Date, end: Date): Promise<IWorkload> {

      if (!this.logging) {
         throw new Error("Logging must be turned on to get a workload fragment");
      }

      const delta = end.getTime() - start.getTime();
      if (delta <= 0) {
         throw new Error("end cannot be before start");
      }

      const commands = await this.queryGeneralLog(start, end);
      return {start: start.toString(), end: end.toString(), commands};
   }

   public async setLogging(on: boolean): Promise<void> {

      // TODO: check if any other captures have logging turned on

      if (on === this.logging) {
         throw new Error(`Logging is already ${on ? "on" : "off"}`);
      }

      on ? await this.turnOnLogging() : await this.turnOffLogging();
      this.logging = on;

   }

   protected abstract turnOnLogging(): Promise<void>;
   protected abstract turnOffLogging(): Promise<void>;
   protected abstract queryGeneralLog(start: Date, end: Date): Promise<ICommand[]>;

}
