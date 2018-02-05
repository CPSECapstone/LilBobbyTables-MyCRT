import { assert, expect } from 'chai';
import 'mocha';

import { mergeIMetricsLists } from '../../metrics/metrics-merger';
import * as dummy from './data';

const sortedTimes = [dummy.time1, dummy.time2, dummy.time3, dummy.time4, dummy.time5];

describe('mergeIMetricsList', () => {

   it('should merge, sort, and remove duplicates', () => {
      const actual = mergeIMetricsLists(dummy.metricsA, dummy.metricsB);
      expect(actual.length).to.equal(2);
      expect(actual[0].type).to.not.equal(actual[1].type);
      actual.forEach((list) => {
         expect(list.dataPoints.length).to.equal(5);
         assert.deepEqual(list.dataPoints.map((metric) => metric.Timestamp), sortedTimes);
      });
   });

});
