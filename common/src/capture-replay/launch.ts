import * as child_process from 'child_process';

import { defaultLogger } from '../logging';

const logger = defaultLogger(__dirname);

export const launch = (name: string, args: string[]) => {

   logger.info(`launching ${name}`);
   logger.info(`   ${name} ${args.join(' ')}`);

   const process = child_process.spawn(name, args);

   process.stdout.on('data', (data: string) => {
      logger.info(`[${name} stdout] ${data.toString().trim()}`);
   });

   process.stderr.on('data', (data: string) => {
      logger.error(`[${name} stderr] ${data.toString().trim()}`);
   });

   process.on('close', (code: any) => {
      logger.info(`[${name} exited] ${code}`);
   });

   process.on('error', (error: string) => {
      logger.error(`[${name} ERROR] ${error.toString().trim()}`);
   });

};
