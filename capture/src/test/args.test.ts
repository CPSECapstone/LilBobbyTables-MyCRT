import { expect } from 'chai';
import 'mocha';

import * as args from '../args';

describe("CaptureConfig", () => {

   it("should make the correct option arguments", () => {
      const config = new args.CaptureConfig(8, 1);
      const expected = [
         `--${args.optionId.name}`, '8',
         `--${args.optionEnvId.name}`, '1',
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
