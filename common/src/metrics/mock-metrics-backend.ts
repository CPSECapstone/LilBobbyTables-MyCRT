import { IMetric, IMetricsList, MetricType } from '../data';
import { Metric } from './metrics';
import { MetricsBackend } from './metrics-backend';

/**
 * Produce dummy data for catpures/replays running in a mock mode.
 */
export class MockMetricsBackend extends MetricsBackend {

   private period: number;

   constructor(period: number) {
      super();
      this.period = period;
   }

   protected async getMetrics(metric: Metric, startTime: Date, endTime: Date): Promise<IMetricsList> {
      // min/max values were approximated from metrics samples
      switch (metric.metricType) {
         case MetricType.CPU:
            return this.makeMockData(metric, 3.0, 6.0, startTime, endTime);
         case MetricType.READ:
            return this.makeMockData(metric, 510000000, 540000000, startTime, endTime);
         case MetricType.WRITE:
            return this.makeMockData(metric, 510000000, 540000000, startTime, endTime);
         case MetricType.MEMORY:
            return this.makeMockData(metric, 0, 0.003, startTime, endTime);
         case MetricType.READTHROUGHPUT:
            return this.makeMockData(metric, 510000000, 540000000, startTime, endTime);
         case MetricType.WRITETHROUGHPUT:
            return this.makeMockData(metric, 510000000, 540000000, startTime, endTime);
         case MetricType.FREESTORAGE:
            return this.makeMockData(metric, 510000000, 540000000, startTime, endTime);
         default:
            throw new Error(`Unknown metricName: ${metric.metricType}`);
      }
   }

   private makeMockData(metric: Metric, minVal: number, maxVal: number, startTime: Date,
         endTime: Date): IMetricsList {
      const list: IMetric[] = [];
      for (const cur = new Date(startTime.getTime()); cur < endTime; cur.setSeconds(cur.getSeconds() + this.period)) {
         const val: number = Math.random() * (maxVal - minVal) + minVal;
         list.push(this.makeMockDataPoint(cur, metric.unit, val));
      }

      return {
         label: metric.metricName,
         type: metric.metricType,
         displayName: metric.metricName,
         dataPoints: list,
      };
   }

   private makeMockDataPoint(time: Date, unit: string, val: number): IMetric {
      return {
         Timestamp: time.toString(),
         Unit: unit,
         Maximum: val,
      };
   }

}
