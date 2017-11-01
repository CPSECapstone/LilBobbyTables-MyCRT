import * as child_process from 'child_process';

import { Logging } from '@lbt-mycrt/common';

const logger = Logging.getLogger();

export const launch = () => {
   logger.info("launching capture");

   child_process.spawn('capture')

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
