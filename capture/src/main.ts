#!/usr/bin/env node

import { Logging } from '@lbt-mycrt/common';

import { CaptureConfig } from './args';
import { Capture } from './capture';

if (typeof(require) !== 'undefined' && require.main === module) {

   const logger = Logging.getLogger(true, Logging.simpleFormatter);

   logger.info("Configuring MyCRT Capture Program");
   const capture = new Capture(CaptureConfig.fromCmdArgs());

   logger.info("Running MyCRT Capture Program");
   capture.run();

}

export { launch } from './launch';
