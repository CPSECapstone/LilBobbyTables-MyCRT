import { ChildProgramStatus, ChildProgramType, IChildProgram, IMetric, IMetricsList, MetricType } from '../data';
import { defaultLogger } from '../logging';
import { StorageBackend } from '../storage/backend';

const logger = defaultLogger(__dirname);

/**
 * Reads/Write metrics to a storage backend.
 */
export class MetricsStorage {

   public static getDoneMetricsKey(childProgram: IChildProgram): string {
      const childType = childProgram.type === ChildProgramType.CAPTURE ? "capture" : "replay";
      return `${childType}${childProgram.id}/metrics.json`;
   }

   public static specificMetricFromList(list: IMetricsList[], type: MetricType): IMetricsList {
      for (const metric of list) {
         if (metric.type === type) {
            return metric;
         }
      }
      throw new Error(`Bad Metric Type: ${type}`);
   }

   constructor(private backend: StorageBackend) {}

   public readMetrics(childProgram: IChildProgram, metricType?: MetricType | undefined):
         Promise<IMetricsList | IMetricsList[]> {

      switch (childProgram.status) {

         case ChildProgramStatus.SCHEDULED:
         case ChildProgramStatus.STARTING:
            throw new Error(`Its too early to get metrics`);

         case ChildProgramStatus.RUNNING:
         case ChildProgramStatus.STOPPING:
            return this.readMetricsStatusLive(childProgram, metricType);

         case ChildProgramStatus.DONE:
         case ChildProgramStatus.FAILED:
            return this.readMetricsStatusDead(childProgram, metricType);

         default:
            throw new Error(`Bad ChildProgramStatus: ${childProgram.status}`);
      }

   }

   private async readMetricsStatusLive(childProgram: IChildProgram, metricType: MetricType | undefined):
         Promise<IMetricsList | IMetricsList[]> {

      throw new Error('NOT IMPLEMENTED');

   }

   private async readMetricsStatusDead(childProgram: IChildProgram, metricType: MetricType | undefined):
         Promise<IMetricsList | IMetricsList[]> {

      const key = MetricsStorage.getDoneMetricsKey(childProgram);
      if (metricType === undefined) {
         return this.backend.readJson<IMetricsList[]>(key);
      }

      return new Promise<IMetricsList>(async (resolve, reject) => {
         const metrics = await this.backend.readJson<IMetricsList[]>(key);
         for (const metric of metrics) {
            if (metric.type === metricType) {
               resolve(metric);
               return;
            }
         }
         reject(`No metrics for ${metricType}`);
      });

   }

}
