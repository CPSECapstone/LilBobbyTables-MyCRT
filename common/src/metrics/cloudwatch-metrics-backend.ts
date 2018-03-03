import { CloudWatch } from 'aws-sdk';

import { IMetricsList } from '../data';
import { Metric } from './metrics';
import { MetricsBackend, toIMetricsList } from './metrics-backend';

export class CloudWatchMetricsBackend extends MetricsBackend {

   public cloudwatch: CloudWatch;
   public dimName: string;
   public dimValue: string;
   public period: number;
   public statistics: string[];

   constructor(cloudwatch: CloudWatch, dimName: string, dimValue: string, period: number, statistics: string[]) {
      super();
      this.cloudwatch = cloudwatch;
      this.dimName = dimName;
      this.dimValue = dimValue;
      this.period = period;
      this.statistics = statistics;
   }

   protected getMetrics(metric: Metric, startTime: Date, endTime: Date): Promise<IMetricsList> {
      return new Promise<IMetricsList>((resolve, reject) => {
         this.cloudwatch.getMetricStatistics(this.buildMetricRequest(metric, startTime, endTime),
               (err, data) => {
            if (err) {
               reject(err.stack);
            } else {
               resolve(toIMetricsList(metric, data));
            }
         });
      });
   }

   private buildMetricRequest(metric: Metric, startTime: Date, endTime: Date):
         CloudWatch.Types.GetMetricStatisticsInput {
      return {
         Dimensions: [
            {
               Name: this.dimName,
               Value: this.dimValue,
            },
         ],
         EndTime: endTime,
         MetricName: metric.metricName,
         Namespace: 'AWS/RDS',
         Period: this.period,
         StartTime: startTime,
         Statistics: this.statistics,
         Unit: metric.unit,
      };
   }

}
