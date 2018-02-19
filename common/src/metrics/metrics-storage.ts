import { ChildProgramStatus, ChildProgramType, IChildProgram, IMetric, IMetricsList, MetricType } from '../data';
import { defaultLogger } from '../logging';
import { StorageBackend } from '../storage/backend';
import { mergeIMetricsLists } from './metrics-merger';
import { iMetricsListArrToString } from './utils';

const logger = defaultLogger(__dirname);

/**
 * Reads/Write metrics to a storage backend.
 */
export class MetricsStorage {

   public static METRICS_TIME_PATTERN = /^metrics\-\d+\.json$/;

   /**
    * Get the root prefix for a child program.
    */
   public static getRootPrefix(childProgram: IChildProgram): string {
      const childType = MetricsStorage.childProcessTypeToString(childProgram.type);
      return `${childType}${childProgram.id}/`;
   }

   /**
    * Get the depot prefix for a child program.
    */
   public static getDepotPrefix(childProgram: IChildProgram): string {
      return `${MetricsStorage.getRootPrefix(childProgram)}depot/`;
   }

   /**
    * Get the storage key for a completed metrics file.
    */
   public static getDoneMetricsKey(childProgram: IChildProgram): string {
      return `${MetricsStorage.getRootPrefix(childProgram)}metrics.json`;
   }

   /**
    * Get the storage key for the in-progress metrics file at a given time.
    */
   public static getInProgressMetricsKey(childProgram: IChildProgram, time: Date): string {
      return `${MetricsStorage.getRootPrefix(childProgram)}metrics-${time.getTime()}.json`;
   }

   /**
    * Get the storage key for a single sample metrics file at a given time.
    */
   public static getSingleSampleMetricsKey(childProgram: IChildProgram, time: Date): string {
      return `${MetricsStorage.getDepotPrefix(childProgram)}metrics-${time.getTime()}.json`;
   }

   /**
    * Pulls an element that matches the metric type from a list.
    */
   public static getSpecificMetricFromList(list: IMetricsList[], type: MetricType): IMetricsList {
      list = list.filter((metrics) => metrics.type === type );
      if (list.length <= 0) {
         throw new Error(`No metrics of type ${type}`);
      } else if (list.length > 1) {
         throw new Error(`Too many (${list.length}) IMetricsLists with type ${type}`);
      }
      return list[0];
   }

   private static childProcessTypeToString(type?: ChildProgramType): string {
      switch (type) {
         case ChildProgramType.CAPTURE:
            return "capture";
         case ChildProgramType.REPLAY:
            return "replay";
         default:
            throw new Error(`Bad Metric Type: ${type}`);
      }
   }

   private static getTimeFromKey(key: string): number {
      return parseInt(key.match(/^.*metrics\-(\d+)\.json$/)![1]);
   }

   /**
    * New MetricsStorage to interface with the provided backend.
    *
    * @param backend An interface to the storage mechanism.
    */
   constructor(private backend: StorageBackend) {}

   /**
    * Read specific metrics for a child program.
    *
    * @param childProgram The program in quesiton.
    * @param metricType The desired metric type. If undefined or null, all are returned.
    */
   public readMetrics(childProgram: IChildProgram, metricType?: MetricType | null):
         Promise<IMetricsList | IMetricsList[]> {

      switch (childProgram.status) {

         case ChildProgramStatus.SCHEDULED:
         case ChildProgramStatus.STARTING:
            throw new Error(`Its too early to get metrics`);

         case ChildProgramStatus.RUNNING:
         case ChildProgramStatus.STOPPING:
            logger.info("Reading live metrics");
            return this.readMetricsFromBackend(childProgram, metricType, true);

         case ChildProgramStatus.DONE:
         case ChildProgramStatus.FAILED:
            logger.info("Reading dead metrics");
            return this.readMetricsFromBackend(childProgram, metricType, false);

         default:
            throw new Error(`Bad ChildProgramStatus: ${childProgram.status}`);
      }

   }

   /**
    * Read the metrics for a process based on the schema described here:
    * https://github.com/CPSECapstone/LilBobbyTables-MyCRT/wiki/S3-File-Storage-Schema
    *
    * @param childProgram The program in question.
    * @param metricType The metric time to read. If undefined or null, all are returned.
    * @param live Whether or not the program is still gathering metrics.
    */
   private async readMetricsFromBackend(childProgram: IChildProgram, metricType: MetricType | undefined | null,
         live: boolean): Promise<IMetricsList | IMetricsList[]> {

      let metrics: IMetricsList[];
      const doneKey = MetricsStorage.getDoneMetricsKey(childProgram);

      const isDone = await this.backend.exists(doneKey);
      if (isDone) {
         logger.info("reading full metrics file");
         metrics = await this.backend.readJson<IMetricsList[]>(doneKey);

      } else {
         logger.info("getting updated metrics");
         const result = await this.getUpdatedMetrics(childProgram);
         const date = result[1];
         metrics = result[0];

         if (live) {
            logger.info(`updating in-progress metrics to time ${date.getTime()}`);
            await this.updateInProgressMetrics(childProgram, metrics, date);

         } else {
            logger.info("creating final metrics file");
            await this.backend.writeJson<IMetricsList[]>(doneKey, metrics);

            logger.info("cleaning up in-progress metrics and depot files");
            await this.deleteInProgressAndDepot(childProgram);

         }
      }

      if (!metricType) {
         return metrics;
      }

      try {
         return MetricsStorage.getSpecificMetricFromList(metrics, metricType);
      } catch (e) {
         throw new Error(`No metrics for type ${metricType}`);
      }
   }

   /**
    * read the in-progress metrics file (if it exists), and add any metrics files in the depot that
    * were added after the in-progress metrics file was created.
    */
   private async getUpdatedMetrics(childProgram: IChildProgram): Promise<[IMetricsList[], Date]> {

      logger.info("get any in-progress metrics");
      const inProgress = await this.getLatestInProgressMetrics(childProgram);
      const lastTime = inProgress[0] ? MetricsStorage.getTimeFromKey(inProgress[0]!) : Number.MIN_VALUE;
      let metrics = inProgress[1];
      let newTime = lastTime;

      logger.info("check for new metrics");
      const depotPrefix = MetricsStorage.getDepotPrefix(childProgram);
      const depotKeys = await this.backend.allMatching(depotPrefix, MetricsStorage.METRICS_TIME_PATTERN);
      for (const key of depotKeys) {
         const time = MetricsStorage.getTimeFromKey(key);
         if (time > lastTime) {
            const sample = await this.backend.readJson<IMetricsList[]>(key);
            logger.info(`   found at ${key} with time ${time}: ${iMetricsListArrToString(sample)}`);
            metrics = mergeIMetricsLists(metrics, sample);
            newTime = time;
         }
      }

      const newDate = new Date(newTime);
      logger.info(`Got updated metrics: ${iMetricsListArrToString(metrics)} at ${newDate.getTime()}`);

      return [metrics, newDate];
   }

   /**
    * write the metrics as the new in-progress metrics file, and delete the old ones
    */
   private async updateInProgressMetrics(childProgram: IChildProgram, metrics: IMetricsList[], date: Date) {
      logger.info(`Deleting any existing in-progress metrics`);
      await this.deleteInProgress(childProgram);
      const key = MetricsStorage.getInProgressMetricsKey(childProgram, date);
      logger.info(`Updating in-progress metrics: ${key}`);
      await this.backend.writeJson<IMetricsList[]>(key, metrics);
   }

   /**
    * Load any in-progress metrics
    */
   private async getLatestInProgressMetrics(childProgram: IChildProgram): Promise<[string | null, IMetricsList[]]> {
      let key: string | null = null;
      let lastTime: number = Number.MIN_VALUE;

      const rootPrefix = MetricsStorage.getRootPrefix(childProgram);
      const inProgressKeys = await this.backend.allMatching(rootPrefix, MetricsStorage.METRICS_TIME_PATTERN);
      inProgressKeys.forEach((inProgressKey: string) => {
         const time = MetricsStorage.getTimeFromKey(inProgressKey);
         if (time > lastTime) {
            key = inProgressKey;
            lastTime = time;
         }
      });

      let result: IMetricsList[] = [];
      if (key !== null) {
         logger.info(`Found in-progress metrics at ${key}`);
         result = await this.backend.readJson<IMetricsList[]>(key);
      } else {
         logger.info(`No in-progress metrics`);
      }
      return [key, result];
   }

   /**
    * delete any in-progress metrics files and the depot folder.
    */
   private async deleteInProgressAndDepot(childProgram: IChildProgram) {
      await this.deleteInProgress(childProgram);
      await this.deleteDepotFolder(childProgram);
   }

   /**
    * delete any in-progress metrics files.
    */
   private async deleteInProgress(childProgram: IChildProgram) {
      const rootPrefix = MetricsStorage.getRootPrefix(childProgram);
      const keys = await this.backend.allMatching(rootPrefix, MetricsStorage.METRICS_TIME_PATTERN);
      logger.info(`Deleting ${keys.length} in-progress metrics file(s)`);
      keys.forEach(async (key: string) => {
         await this.backend.deleteJson(key);
      });
   }

   /**
    * delete the depot folder.
    */
   private async deleteDepotFolder(childProgram: IChildProgram) {
      const depotPrefix = MetricsStorage.getDepotPrefix(childProgram);
      logger.info(`Deleting all files in ${depotPrefix}`);
      await this.backend.deletePrefix(depotPrefix);
   }
}
