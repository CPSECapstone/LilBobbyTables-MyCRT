import { CloudWatch } from 'aws-sdk';

import { IMetricsList, MetricType } from '../data';

// Metrics to retrieve
export const CPU = 'CPUUtilization';
export const IO = 'ReadLatency';
export const MEMORY = 'FreeableMemory';

export const cpuUnit = 'Percent';
export const ioUnit = 'Seconds';
export const memoryUnit = 'Bytes';

export const nameToType = (name: string): MetricType => {
   switch (name) {
      case CPU:
         return MetricType.CPU;
      case IO:
         return MetricType.IO;
      case MEMORY:
         return MetricType.MEMORY;
      default:
         throw new Error(`Unknown metric name: ${name}`);
   }
};

export const toIMetricsList = (data: CloudWatch.GetMetricStatisticsOutput): IMetricsList => {
   const labelStr = data.Label || CPU;
   return {
      label: labelStr,
      type: nameToType(labelStr),
      displayName: nameToType(labelStr),
      dataPoints: (data.Datapoints || []) as any,
   };
};

export abstract class MetricsBackend {

   public getCPUMetrics(startTime: Date, endTime: Date) {
      return this.getMetrics(CPU, cpuUnit, startTime, endTime);
   }

   public getIOMetrics(startTime: Date, endTime: Date) {
      return this.getMetrics(IO, ioUnit, startTime, endTime);
   }

   public getMemoryMetrics(startTime: Date, endTime: Date) {
      return this.getMetrics(MEMORY, memoryUnit, startTime, endTime);
   }

   protected abstract getMetrics(metricName: string, unit: string, startTime: Date, endTime: Date):
      Promise<IMetricsList>;

}
