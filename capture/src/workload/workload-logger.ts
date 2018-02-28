import { ChildProgramType } from '@lbt-mycrt/common';
import { StorageBackend } from '@lbt-mycrt/common/dist/storage/backend';

// TODO: getting the workloads needs some work.
//
//    - need to correctly parse out requests that matter
//    - need to ensure that the log fits in the desired window
//    - need to portion up the queries so that they don't happen all at once at the end of a capture/replay
//

export abstract class WorkloadLogger {

   protected logging: boolean = false;

   constructor(public readonly type: ChildProgramType, public readonly id: number, protected storage: StorageBackend) {}

   public get isLogging() {
      return this.logging;
   }

   public async setLogging(on: boolean): Promise<void> {

      if (on === this.logging) {
         throw new Error(`Logging is already ${on ? "on" : "off"}`);
      }

      on ? await this.turnOnLogging() : await this.turnOffLogging();
      this.logging = on;

   }

   public getWorkloadKey(): string {
      const typeStr = this.type === ChildProgramType.CAPTURE ? 'capture' : 'replay';
      return `${typeStr}${this.id}/workload.json`;
   }

   public async persistWorkload(): Promise<void> {
      const workload = await this.queryGeneralLog();
      await this.storage.writeJson<any>(this.getWorkloadKey(), workload);
   }

   protected abstract turnOnLogging(): Promise<void>;
   protected abstract turnOffLogging(): Promise<void>;
   protected abstract queryGeneralLog(): Promise<any[]>;

}
