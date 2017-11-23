import 'mocha';
import { LoggerInstance } from 'winston';

import Logging = require('../logging');

const logAtAllLevels = (logger: LoggerInstance) => {
   logger.silly("This is silly");
   logger.debug("I am debugging!");
   logger.verbose("blah blah blah blah");
   logger.info("fyi...");
   logger.warn("don't eat the yellow snow");
   logger.error("Help, I need somebody, HELP! Not just anybody...");
};

describe("Logging", () => {

   describe("defaultLogger", () => {
      it("can log at all levels", () => {
         const logger = Logging.defaultLogger(__dirname);
         logger.configure({transports: []});
         logAtAllLevels(logger);
      });
   });

   describe("getLogger", () => {
      it("should log at all levels", () => {
         const logger = Logging.getLogger();
         logger.configure({transports: []});
         logAtAllLevels(logger);
      });
   });

});
