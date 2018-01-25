import * as child_process from 'child_process';

import { Logging } from '@lbt-mycrt/common';

import { ICaptureConfig } from './capture';

const logger = Logging.getLogger(true, Logging.simpleFormatter);

export const launch = (config: ICaptureConfig) => {

   logger.info("launching capture");

   child_process.spawn('mycrt-capture', [`${config.id}`])

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
