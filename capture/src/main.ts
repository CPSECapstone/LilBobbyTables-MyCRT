#!/usr/bin/env node

import { Logging } from '@lbt-mycrt/common';

if (typeof(require) !== 'undefined' && require.main === module) {

   const logger = Logging.getLogger();

   logger.info("Running MyCRT Capture Program");

}

export { launch } from './launch';
