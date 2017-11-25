#!/usr/bin/env node

import { Logging } from '@lbt-mycrt/common';

import { Capture } from './capture';

if (typeof(require) !== 'undefined' && require.main === module) {

   const logger = Logging.getLogger(true, Logging.simpleFormatter);
   logger.info("Running MyCRT Capture Program");

   const config = {
      id: 42,
      interval: 2 * 1000 * 60, // 2 minutes
   };

   const capture = new Capture(config);

   capture.run();

}

export { launch } from './launch';
