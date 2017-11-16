import { expect } from 'chai';
import 'mocha';

import { Configuration, ProcessType } from '../../capture-replay/configuration';

describe("Configuration", () => {

   const id: number = 48932;
   const config = new Configuration(id, ProcessType.CAPTURE);

   it("should have the correct id", () => {
      expect(config.id).to.equal(id);
   });

   it("should have a logFile", () => {
      const logFile = config.logFile;
      expect(config.logFile).to.have.lengthOf.above(0);
      expect(config.logFile).to.match(/capture48932\.log$/);
   });

});
