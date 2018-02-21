import { expect } from 'chai';
import 'mocha';

import * as data from '../../data';
import { MetricsStorage } from '../../metrics/metrics-storage';

import { metricsAllTypes } from './data';

describe("MetricsStorage", () => {

   const date = new Date(100200300);
   const capture: data.ICapture = {
      type: data.ChildProgramType.CAPTURE,
      id: 100,
   };

   it("should get the root prefix", () => {
      const actual = MetricsStorage.getRootPrefix(capture);
      const expected = "capture100/";
      expect(actual).to.equal(expected);
   });

   it("should get the depot prefix", () => {
      const actual = MetricsStorage.getDepotPrefix(capture);
      const expected = "capture100/depot/";
      expect(actual).to.equal(expected);
   });

   it("should get the done metrics key", () => {
      const actual = MetricsStorage.getDoneMetricsKey(capture);
      const expected = "capture100/metrics.json";
      expect(actual).to.equal(expected);
   });

   it("should get an in-progress metrics key", () => {
      const actual = MetricsStorage.getInProgressMetricsKey(capture, date);
      const expected = "capture100/metrics-100200300.json";
      expect(actual).to.equal(expected);
   });

   it("should get a single sample metrics key", () => {
      const actual = MetricsStorage.getSingleSampleMetricsKey(capture, date);
      const expected = "capture100/depot/metrics-100200300.json";
      expect(actual).to.equal(expected);
   });

   it("should get the correct metrics from a list", () => {
      [data.MetricType.CPU, data.MetricType.MEMORY, data.MetricType.READ, data.MetricType.WRITE]
            .forEach((type) => {
         const metrics = MetricsStorage.getSpecificMetricFromList(metricsAllTypes, type);
         expect(metrics.type).to.equal(type);
      });
   });

});
