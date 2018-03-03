import { ChildProgramStatus, ChildProgramType, IChildProgram, IMetric, IMetricsList, MetricType } from '../data';
import { defaultLogger } from '../logging';
import { StorageBackend } from '../storage/backend';
import { FragmentType } from '../storage/backend-schema';
import { FragmentedStorage } from '../storage/fragmented-storage';
import { mergeIMetricsLists } from './metrics-merger';
import { iMetricsListArrToString } from './utils';

const logger = defaultLogger(__dirname);

/**
 * Reads/Write metrics to a storage backend.
 */
export class MetricsStorage extends FragmentedStorage<IMetricsList[]> {

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

   /**
    * New MetricsStorage to interface with the provided backend.
    *
    * @param backend An interface to the storage mechanism.
    */
   constructor(backend: StorageBackend) {
      super(FragmentType.METRICS, backend);
   }

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

   protected getDefaultObject(): IMetricsList[] {
      return [];
   }

   protected mergeObjects(a: IMetricsList[], b: IMetricsList[]): IMetricsList[] {
      return mergeIMetricsLists(a, b);
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

      const metrics = await this.read(childProgram, live);

      if (!metricType) {
         return metrics;
      }

      try {
         return MetricsStorage.getSpecificMetricFromList(metrics, metricType);
      } catch (e) {
         throw new Error(`No metrics for type ${metricType}`);
      }
   }

}
