import { ChildProgramStatus, ChildProgramType, IChildProgram, IMetric, IMetricsList, MetricType } from '../data';
import { defaultLogger } from '../logging';
import { StorageBackend } from '../storage/backend';

const logger = defaultLogger(__dirname);

/**
 * Reads/Write metrics to the backend.
 */
export class MetricsBackend {

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
      throw new BadMetricTypeError();
   }

   constructor(private backend: StorageBackend) {}

   public readMetrics(childProgram: IChildProgram, metricType?: MetricType | undefined):
         Promise<IMetricsList | IMetricsList[]> {

      switch (childProgram.status) {
         case ChildProgramStatus.LIVE:
            return this.readMetricsStatusDead(childProgram, metricType);
         case ChildProgramStatus.DEAD:
            return this.readMetricsStatusDead(childProgram, metricType);
         default:
            throw new BadChildProgramStatusError();
      }

   }

   private readMetricsStatusLive(childProgram: IChildProgram, metricType: MetricType | undefined):
         Promise<IMetricsList | IMetricsList[]> {

      return new Promise((resolve, reject) => {
         reject('NOT IMPLEMENTED');
      });

   }

   private async readMetricsStatusDead(childProgram: IChildProgram, metricType: MetricType | undefined):
         Promise<IMetricsList | IMetricsList[]> {

      const key = MetricsBackend.getDoneMetricsKey(childProgram);
      if (metricType === undefined) {
         return this.readFromBackend<IMetricsList[]>(key);
      }

      return new Promise<IMetricsList>(async (resolve, reject) => {
         const metrics = await this.readFromBackend<IMetricsList[]>(key);
         for (const metric of metrics) {
            if (metric.type === metricType) {
               resolve(metric);
               return;
            }
         }
         reject(`No metrics for ${metricType}`);
      });

   }

   private readFromBackend<T>(key: string): Promise<T> {
      return this.backend.readJson<T>(key);
   }

}

export class BadChildProgramStatusError extends Error {}

export class BadMetricTypeError extends Error {}
