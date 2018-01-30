import * as child_process from 'child_process';

import { Logging } from '@lbt-mycrt/common';

import { IReplayConfig } from './replay';

const logger = Logging.getLogger(true, Logging.simpleFormatter);

export const launch = (config: IReplayConfig) => {

   logger.info("launching replay");

   child_process.spawn('mycrt-replay', [`${config.id}`])

      .stdout.on('data', (data: string) => {
         logger.info("[replay stdout] " + data);
      })

      .on('close', (code: any) => {
         logger.info("[replay]  exited with code " + code);
      })

      .on('error', (error: string) => {
         logger.error(`Replay ${config.id} errorred: ${error}`);
      })

   ;

};
