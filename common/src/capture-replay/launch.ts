import * as child_process from 'child_process';

import { IEnvironmentFull } from '../data';
import { defaultLogger, noopLogger } from '../logging';

const logger = defaultLogger(__dirname);

export const launch = (id: string, cmd: string, args: string[], env: IEnvironmentFull | null) => {

   logger.info(`launching ${cmd}`);
   logger.info(`   ${cmd} ${args.join(' ')}`);

   const process = child_process.spawn(cmd, args);
   const childLogger = noopLogger(__dirname);

   process.stdout.on('data', (data: string) => {
      childLogger.info(`[${id} stdout] ${data.toString().trim()}`);
   });

   process.stderr.on('data', (data: string) => {
      childLogger.error(`[${id} stderr] ${data.toString().trim()}`);
   });

   process.on('close', (code: any) => {
      logger.info(`[${id} exited] ${code}`);
   });

   process.on('error', (error: string) => {
      logger.error(`[${id} ERROR] ${error.toString().trim()}`);
   });

};
