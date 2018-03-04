import { expect } from 'chai';
import 'mocha';

import * as data from '../../data';
import { MetricsStorage } from '../../metrics/metrics-storage';
import { metricsAllTypes } from '../metrics/data';

import { path } from '../../storage/backend-schema';

describe("backend-schema", () => {

   const date = new Date(100200300);
   const capture: data.ICapture = {
      type: data.ChildProgramType.CAPTURE,
      id: 100,
   };

   it("should get the root prefix", () => {
      const actual = path.getRootPrefix(capture);
      const expected = "capture100/";
      expect(actual).to.equal(expected);
   });

   it("should get the depot prefix", () => {
      const actual = path.getDepotPrefix(capture);
      const expected = "capture100/depot/";
      expect(actual).to.equal(expected);
   });

   it("should get the done metrics key", () => {
      const actual = path.metrics.getDoneKey(capture);
      const expected = "capture100/metrics.json";
      expect(actual).to.equal(expected);
   });

   it("should get an in-progress metrics key", () => {
      const actual = path.metrics.getInProgressKey(capture, date);
      const expected = "capture100/metrics-100200300.json";
      expect(actual).to.equal(expected);
   });

   it("should get a single sample metrics key", () => {
      const actual = path.metrics.getSingleSampleKey(capture, date);
      const expected = "capture100/depot/metrics-100200300.json";
      expect(actual).to.equal(expected);
   });

   describe("FragmentTypeSchema", () => {

      it("should get a time from a key", () => {
         const key = "/tmp/MyCRT/sandbox/capture3/metrics-100200300.json";
         const actual = path.metrics.getTimeFromKey(key);
         expect(actual).to.equal(100200300);
      });

   });

});
