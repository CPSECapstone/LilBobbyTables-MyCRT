import { IChildProgram } from '../data';
import { defaultLogger } from '../logging';
import { StorageBackend } from './backend';
import { FragmentType, FragmentTypeSchema, path } from './backend-schema';

const logger = defaultLogger(__dirname);

export abstract class FragmentedStorage<T> {

   protected schema: FragmentTypeSchema;

   /**
    * New MetricsStorage to interface with the provided backend.
    *
    * @param fragmentType The type of fragmented storage to read from.
    * @param backend An interface to the storage mechanism.
    */
   constructor(public readonly fragmentType: FragmentType, protected backend: StorageBackend) {
      this.schema = path.getSchema(fragmentType);
   }

   public async read(childProgram: IChildProgram, live: boolean): Promise<T> {

      let result: T;
      const doneKey = this.schema.getDoneKey(childProgram);

      const isDone = await this.backend.exists(doneKey);
      if (isDone) {
         logger.info(`reading full ${this.fragmentType} file`);
         result = await this.backend.readJson<T>(doneKey);

      } else {
         logger.info(`getting updated ${this.fragmentType}`);
         const updated = await this.getUpdatedObject(childProgram);
         const date = updated[1];
         result = updated[0];

         if (live) {
            logger.info(`updating in-progress ${this.fragmentType} to time ${date.getTime()}`);
            await this.updateInProgressObject(childProgram, result, date);

         } else {
            logger.info(`creating final ${this.fragmentType} file`);
            await this.backend.writeJson<T>(doneKey, result);

            logger.info(`cleaning up in-progress ${this.fragmentType} and depot files`);
            await this.cleanInProgressAndDepotFiles(childProgram);

         }
      }

      return result;
   }

   protected abstract objectToString(obj: T): string;
   protected abstract getDefaultObject(): T;
   protected abstract mergeObjects(a: T, b: T): T;

   private async getUpdatedObject(childProgram: IChildProgram): Promise<[T, Date]> {

      logger.info(`get any in-progress ${this.fragmentType} file`);
      const inProgress = await this.getLatestInProgressObject(childProgram);
      const lastTime = inProgress[0] ? this.schema.getTimeFromKey(inProgress[0]!) : Number.MIN_VALUE;
      let result = inProgress[1];
      let newTime = lastTime;

      logger.info(`check for new ${this.fragmentType} file`);
      const depotPrefix = path.getDepotPrefix(childProgram);
      const depotKeys = await this.backend.allMatching(depotPrefix, this.schema.timePattern);
      for (const key of depotKeys) {
         const time = this.schema.getTimeFromKey(key);
         if (time > lastTime) {
            logger.info(`   found at ${key} with time ${time}:`);
            const sample = await this.backend.readJson<T>(key);
            logger.info(`      - ${this.objectToString(sample)}`);
            result = this.mergeObjects(result, sample);
            newTime = time;
         }
      }

      const newDate = new Date(newTime);
      logger.info(`Got updated ${this.fragmentType}: ${this.objectToString(result)} at ${newDate.getTime()}`);

      return [result, newDate];
   }

   private async updateInProgressObject(childProgram: IChildProgram, obj: T, date: Date) {
      logger.info(`Deleting any existing in-progress ${this.fragmentType}`);
      await this.deleteInProgress(childProgram);
      const key = this.schema.getInProgressKey(childProgram, date);
      logger.info(`Updating in-progress ${this.fragmentType}: ${key}`);
      await this.backend.writeJson<T>(key, obj);
   }

   private async getLatestInProgressObject(childProgram: IChildProgram): Promise<[string | null, T]> {
      let key: string | null = null;
      let lastTime: number = Number.MIN_VALUE;

      const rootPrefix = path.getRootPrefix(childProgram);
      const inProgressKeys = await this.backend.allMatching(rootPrefix, this.schema.timePattern);
      inProgressKeys.forEach((inProgressKey: string) => {
         const time = this.schema.getTimeFromKey(inProgressKey);
         if (time > lastTime) {
            key = inProgressKey;
            lastTime = time;
         }
      });

      let result: T = this.getDefaultObject();
      if (key !== null) {
         logger.info(`Found in-progress ${this.fragmentType} at ${key}`);
         result = await this.backend.readJson<T>(key);
      } else {
         logger.info(`No in-progress ${this.fragmentType}`);
      }

      return [key, result];
   }

   private async cleanInProgressAndDepotFiles(childProgram: IChildProgram) {
      await this.deleteInProgress(childProgram);
      await this.deleteDepotEntries(childProgram);
   }

   private async deleteInProgress(childProgram: IChildProgram) {
      const rootPrefix = path.getRootPrefix(childProgram);
      const keys = await this.backend.allMatching(rootPrefix, this.schema.timePattern);
      logger.info(`Deleting ${keys.length} in-progress ${this.fragmentType} file(s)`);
      keys.forEach(async (key: string) => {
         await this.backend.deleteJson(key);
      });
   }

   private async deleteDepotEntries(childProgram: IChildProgram) {
      const depotPrefix = path.getDepotPrefix(childProgram);
      const keys = await this.backend.allMatching(depotPrefix, this.schema.timePattern);
      logger.info(`Deleting ${keys.length} depot ${this.fragmentType} fragment file(s)`);
      keys.forEach(async (key: string) => {
         await this.backend.deleteJson(key);
      });
   }
}
