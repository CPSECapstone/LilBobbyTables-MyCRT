import { IMetric, IMetricsList, MetricType } from '../data';
import { MetricsBackend } from './metrics-backend';
import { CPU, MEMORY, READ, WRITE } from './metrics-backend';

/**
 * Produce dummy data for catpures/replays running in a mock mode.
 */
export class MockMetricsBackend extends MetricsBackend {

   private period: number;

   constructor(period: number) {
      super();
      this.period = period;
   }

   protected async getMetrics(metricName: string, unit: string, startTime: Date, endTime: Date): Promise<IMetricsList> {
      // min/max values were approximated from metrics samples
      switch (metricName) {
         case CPU:
            return this.makeMockData(metricName, MetricType.CPU, unit, 3.0, 6.0, startTime, endTime);
         case READ:
            return this.makeMockData(metricName, MetricType.READ, unit, 510000000, 540000000, startTime, endTime);
         case WRITE:
            return this.makeMockData(metricName, MetricType.WRITE, unit, 510000000, 540000000, startTime, endTime);
         case MEMORY:
            return this.makeMockData(metricName, MetricType.MEMORY, unit, 0, 0.003, startTime, endTime);
         default:
            throw new Error(`Unknown metricName: ${metricName}`);
      }
   }

   private makeMockData(label: string, type: MetricType, unit: string, minVal: number, maxVal: number, startTime: Date,
         endTime: Date): IMetricsList {
      const list: IMetric[] = [];
      for (const cur = new Date(startTime.getTime()); cur < endTime; cur.setSeconds(cur.getSeconds() + this.period)) {
         const val: number = Math.random() * (maxVal - minVal) + minVal;
         list.push(this.makeMockDataPoint(cur, unit, val));
      }

      return {
         label,
         type,
         displayName: label,
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
