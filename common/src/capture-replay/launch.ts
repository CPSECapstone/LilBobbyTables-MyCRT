import * as child_process from 'child_process';

import { IEnvironmentFull } from '../data';
import { defaultLogger, noopLogger } from '../logging';

const logger = defaultLogger(__dirname);

export const launch = (id: string, cmd: string, args: string[]) => {

   logger.info(`launching ${cmd}`);
   logger.info(`   ${cmd} ${args.join(' ')}`);

   const process = child_process.spawn(cmd, args);
   const childLogger = noopLogger(__dirname);

   process.stdout.on('data', (data: string) => {
      data.toString().trim().split('\n').forEach((line) => {
         childLogger.info(`[${id} stdout] ${line}`);
      });
   });

   process.stderr.on('data', (data: string) => {
      data.toString().trim().split('\n').forEach((line) => {
         childLogger.error(`[${id} stderr] ${line}`);
      });
   });

   process.on('close', (code: any) => {
      logger.info(`[${id} exited] ${code}`);
   });

   process.on('error', (error: string) => {
      logger.error(`[${id} ERROR] ${error.toString().trim()}`);
   });

};
