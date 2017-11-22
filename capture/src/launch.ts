import * as child_process from 'child_process';

import { Logging } from '@lbt-mycrt/common';

const logger = Logging.getLogger(true, Logging.simpleFormatter);

export const launch = () => {

   logger.info("launching capture");

   child_process.spawn('mycrt-capture')

      .stdout.on('data', (data: string) => {
         logger.info("[capture stdout]  " + data);
      })

      .on('close', (code: any) => {
         logger.info("[capture]  exited with code " + code);
      })

      .on('error', (error: string) => {
         logger.info(error);
      })

   ;

};
