import { CloudWatch } from 'aws-sdk';

import { IMetricsList } from '../data';
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

   protected getMetrics(metricName: string, unit: string, startTime: Date, endTime: Date): Promise<IMetricsList> {
      return new Promise<IMetricsList>((resolve, reject) => {
         this.cloudwatch.getMetricStatistics(this.buildMetricRequest(metricName, unit, startTime, endTime),
               (err, data) => {
            if (err) {
               reject(err.stack);
            } else {
               resolve(toIMetricsList(data));
            }
         });
      });
   }

   private buildMetricRequest(metricName: string, unit: string, startTime: Date, endTime: Date) {
      return {
         Dimensions: [
            {
               Name: this.dimName,
               Value: this.dimValue,
            },
         ],
         EndTime: endTime,
         MetricName: metricName,
         Namespace: 'AWS/RDS',
         Period: this.period,
         StartTime: startTime,
         Statistics: this.statistics,
         Unit: unit,
      };
   }

}
