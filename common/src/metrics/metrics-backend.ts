import { IMetric, IMetricsList, MetricType } from '../data';

import { defaultLogger } from '../logging';

const logger = defaultLogger(__dirname);

/**
 * Reads/Write metrics to the backend.
 * TEMPORARY IMPLEMENTATION FOR NOW. Only reads dummy data.
 */
export class MetricsBackend {

   constructor() {

   }

   public readCaptureMetrics(type: MetricType | null | undefined): IMetricsList | [IMetricsList] | null {
      if (!type) {
         return [this.readIo(), this.readMemory(), this.readCpu()];
      }

      switch (type) {
         case MetricType.CPU:
            return this.readCpu();
         case MetricType.IO:
            return this.readIo();
         case MetricType.MEMORY:
            return this.readMemory();
         default:
            return null;
      }
   }

   private readIo(): IMetricsList {
      return this.readDummyData('../../dummydata_io.json', MetricType.IO);
   }

   private readMemory(): IMetricsList {
      return this.readDummyData('../../dummydata_memory.json', MetricType.MEMORY);
   }

   private readCpu(): IMetricsList {
      return this.readDummyData('../../dummydata_cpu.json', MetricType.CPU);
   }

   private readDummyData(path: string, type: MetricType): IMetricsList {
      const dummyMetrics = require(path);
      const metrics: IMetricsList = {
         dataPoints: dummyMetrics.Datapoints as [IMetric],
         displayName: `${type}`,
         label: dummyMetrics.Label,
         live: false,
         type,
      };
      return metrics;
   }

}
