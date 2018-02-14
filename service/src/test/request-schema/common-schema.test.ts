import { expect } from 'chai';
import * as joi from 'joi';
import 'mocha';

import * as data from '@lbt-mycrt/common/dist/data';

import { idParams, metricTypeQuery } from '../../request-schema/common-schema';

describe("idParams", () => {

   it("should find the id if it is a number", () => {
      const input = {id: 123};

      const result = joi.validate(input, idParams);
      expect(result.error).to.be.null;
      expect(result.value.id).to.equal(123);

   });

   it("should find the id if it is a string", () => {
      const input = {id: '123'};

      const result = joi.validate(input, idParams);
      expect(result.error).to.be.null;
      expect(result.value.id).to.equal(123);

   });

   it("should fail if the id is not numeric", () => {
      const input = {id: 'abc'};

      const result = joi.validate(input, idParams);
      expect(result.error).to.not.be.null;

   });

});

describe("metricTypeQuery", () => {

   it("should find the correct type", () => {
      const cpu = {type: 'cpu'};
      let result = joi.validate(cpu, metricTypeQuery);
      expect(result.error).to.be.null;
      expect(result.value.type).to.equal(data.MetricType.CPU);

      const read = {type: 'read'};
      result = joi.validate(read, metricTypeQuery);
      expect(result.error).to.be.null;
      expect(result.value.type).to.equal(data.MetricType.READ);

      const write = {type: 'write'};
      result = joi.validate(write, metricTypeQuery);
      expect(result.error).to.be.null;
      expect(result.value.type).to.equal(data.MetricType.WRITE);

      const memory = {type: 'memORY'};
      result = joi.validate(memory, metricTypeQuery);
      expect(result.error).to.be.null;
      expect(result.value.type).to.equal(data.MetricType.MEMORY);
   });

   it("should not care if the type is missing", () => {
      const input = {};
      const result = joi.validate(input, metricTypeQuery);
      expect(result.error).to.be.null;
   });

});
