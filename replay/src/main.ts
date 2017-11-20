#!/usr/bin/env node

import { Logging } from '@lbt-mycrt/common';

if (typeof(require) !== 'undefined' && require.main === module) {

   const logger = Logging.getLogger();

   logger.info("MyCRT Replay Program");

}

export { launch } from './launch';
