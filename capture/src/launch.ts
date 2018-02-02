import * as child_process from 'child_process';

import { Logging } from '@lbt-mycrt/common';

import { CaptureConfig } from './args';

const logger = Logging.getLogger(true, Logging.simpleFormatter);

export const launch = (config: CaptureConfig) => {

   logger.info("launching capture");

   const childName = 'mycrt-capture';
   const args = config.toArgList();
   logger.info(`   ${childName} ${args.join(' ')}`);

   child_process.spawn(childName, args)

      .stdout.on('data', (data: string) => {
         logger.info("[capture stdout]  " + data);
      })

      .on('close', (code: any) => {
         logger.info("[capture]  exited with code " + code);
      })

      .on('error', (error: string) => {
         logger.error(`Capture ${config.id} errorred: ${error}`);
      })

   ;

};
