import { IMetric, IMetricsList, MetricType } from '../data';
import { defaultLogger } from '../logging';

const logger = defaultLogger(__dirname);

interface ITimestampMap {
   [timestamp: string]: IMetric;
}

interface ITypeMap {
   template: IMetricsList;
   metrics: ITimestampMap;
}

interface IMetricsMap {
   [metricType: string]: ITypeMap;
}

/**
 * Create a new IMetricsList[] from two others. Duplicate data points are removed, and the
 * data point arrays in the result are sorted by Timestamp.
 */
export const mergeIMetricsLists = (a: IMetricsList[], b: IMetricsList[]): IMetricsList[] => {

   // Hash out duplicate timestamp metrics
   const metricsMap: IMetricsMap = {};
   a.concat(b).forEach((metricsList: IMetricsList) => {

      let typeMap: ITypeMap = metricsMap[metricsList.type];
      if (!typeMap) {
         typeMap = metricsMap[metricsList.type] = {template: metricsList, metrics: {}};
      }

      metricsList.dataPoints.forEach((metric: IMetric) => {

         const prevMetric = typeMap.metrics[metric.Timestamp];
         if (prevMetric && prevMetric.Maximum !== metric.Maximum) {
            logger.warn(`Received conflicting metrics for ${metricsList.type} at ${metric.Timestamp}. `
               + `Ignore if running in mock mode.`);
         }

         typeMap.metrics[metric.Timestamp] = metric;

      });
   });

   // build the resulting IMetricsList[]
   const result: IMetricsList[] = [];
   Object.keys(metricsMap).forEach((type: string) => {

      const template = metricsMap[type].template;
      const newIMetricsList: IMetricsList = {
         label: template.label,
         type: template.type,
         displayName: template.displayName,
         complete: template.complete,
         dataPoints: [],
      };
      result.push(newIMetricsList);

      for (const timestamp in metricsMap[type].metrics) {
         newIMetricsList.dataPoints.push(metricsMap[type].metrics[timestamp]);
      }

   });

   // sort the resulting lists
   result.forEach((list: IMetricsList) => {
      list.dataPoints.sort((x: IMetric, y: IMetric): number => {
         const xDate = new Date(x.Timestamp);
         const yDate = new Date(y.Timestamp);
         return xDate.getTime() - yDate.getTime();
      });
   });

   return result;

};
