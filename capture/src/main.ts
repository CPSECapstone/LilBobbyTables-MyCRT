#!/usr/bin/env node

import { Logging } from '@lbt-mycrt/common';

import { Capture } from './capture';

if (typeof(require) !== 'undefined' && require.main === module) {

   const logger = Logging.getLogger(true, Logging.simpleFormatter);

   logger.info("Configuring MyCRT Capture Program");
   const config = {
      id: +process.argv[2],
      interval: 2000, // 2 seconds
      supervised: true,
   };

   const capture = new Capture(config);

   logger.info("Running MyCRT Capture Program");
   capture.run();

}

export { launch } from './launch';
