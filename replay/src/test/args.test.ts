import { expect } from 'chai';
import 'mocha';

import * as args from '../args';

describe("ReplayConfig", () => {

   it("should make the correct option arguments", () => {
      const config = new args.ReplayConfig(8, 12);
      const expected = [
         `--${args.optionId.name}`, '8',
         `--${args.optionCaptureId.name}`, '12',
         `--${args.optionInterval.name}`, `${args.optionInterval.defaultValue}`,
         `--${args.optionIntervalOverlap.name}`, `${args.optionIntervalOverlap.defaultValue}`,
         `--${args.optionSupervised.name}`,
      ];
      const actual = config.toArgList();
      expect(expected.length).to.equal(actual.length);
      expected.forEach((val, index) => {
         expect(val).to.equal(actual[index]);
      });
   });

});
