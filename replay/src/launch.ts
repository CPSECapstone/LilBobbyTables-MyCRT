import * as child_process from 'child_process';

import { Logging } from '@lbt-mycrt/common';

const logger = Logging.getLogger(true, Logging.simpleFormatter);

export const launch = () => {

   logger.info("launching replay");

   child_process.spawn('mycrt-replay')

      .stdout.on('data', (data: string) => {
         logger.info("[replay stdout] " + data);
      })

      .on('close', (code: any) => {
         logger.info("[replay]  exited with code " + code);
      })

      .on('error', (error: string) => {
         logger.info(error);
      })

   ;

};
