#!/usr/bin/env node

import { Logging } from '@lbt-mycrt/common';

import { Replay } from './replay';

if (typeof(require) !== 'undefined' && require.main === module) {

   const logger = Logging.getLogger(true, Logging.simpleFormatter);

   logger.info("Configuring MyCRT Replay Program");
   const config = {
      id: +process.argv[2],
      interval: 2000, // 2 seconds
      supervised: true,
   };

   const replay = new Replay(config);

   logger.info("Running MyCRT Replay Program");
   replay.run();

}

export { launch } from './launch';
