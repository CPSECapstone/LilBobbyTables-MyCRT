import { CloudWatch } from 'aws-sdk';

import { IMetricsList, MetricType } from '../data';
import { Metric } from './metrics';

export const toIMetricsList = (metric: Metric, data: CloudWatch.GetMetricStatisticsOutput): IMetricsList => {
   return {
      label: metric.metricName,
      type: metric.metricType,
      displayName: metric.metricType,
      dataPoints: (data.Datapoints || []) as any,
   };
};

export abstract class MetricsBackend {

   public getMetricsForType(metric: Metric, startTime: Date, endTime: Date) {
      return this.getMetrics(metric, startTime, endTime);
   }

   protected abstract getMetrics(metric: Metric, startTime: Date, endTime: Date):
      Promise<IMetricsList>;

}
