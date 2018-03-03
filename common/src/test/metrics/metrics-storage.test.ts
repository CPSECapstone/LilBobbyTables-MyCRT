import { expect } from 'chai';
import 'mocha';

import * as data from '../../data';

import { metricsAllTypes } from './data';

import { MetricsStorage } from '../../metrics/metrics-storage';

describe("MetricsStorage", () => {

   it("should get the correct metrics from a list", () => {
      [data.MetricType.CPU, data.MetricType.MEMORY, data.MetricType.READ, data.MetricType.WRITE]
            .forEach((type) => {
         const metrics = MetricsStorage.getSpecificMetricFromList(metricsAllTypes, type);
         expect(metrics.type).to.equal(type);
      });
   });

});
