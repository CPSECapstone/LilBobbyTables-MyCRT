import { MYCRT_ENV, mycrtEnv } from '../environment';
import { defaultLogger } from '../logging';

const logger = defaultLogger(__dirname);

// tslint:disable:no-var-requires
export const mycrtDbConfig = (() => {
   let result: any;
   switch (mycrtEnv) {
      case MYCRT_ENV.TRAVIS:
         result = require('../../../scripts/db/config/travis.config.json');
         break;
      case MYCRT_ENV.DEMO:
         result = require('../../../scripts/db/config/demo.config.json');
         break;
      case MYCRT_ENV.DEV:
      default:
         result = require('../../../scripts/db/config/dev.config.json');
         break;
   }
   logger.info(`DbConfig loaded for ${mycrtEnv}: ${JSON.stringify(result)}`);
   return result;
})();
// tslint:enable:no-var-requires
