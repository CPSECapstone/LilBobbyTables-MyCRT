import { IMetricsList } from '../data';

export const iMetricsListArrToString = (metricsList: IMetricsList[]): string => {
   let result = "[IMetricsList: ";
   metricsList.forEach((list) => {
      result += `${list.type}(${list.dataPoints.length}) `;
   });
   return result + ']';
};
