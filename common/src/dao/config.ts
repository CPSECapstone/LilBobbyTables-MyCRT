import { MYCRT_ENV, mycrtEnv } from '../environment';

// tslint:disable:no-var-requires
export const mycrtDbConfig = (() => {
   switch (mycrtEnv) {
      case MYCRT_ENV.TRAVIS:
         return require('../../../scripts/db/config/travis.config.json');
      case MYCRT_ENV.DEV:
      default:
         return require('../../../scripts/db/config/dev.config.json');
   }
})();
// tslint:enable:no-var-requires
