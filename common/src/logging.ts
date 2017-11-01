// documentation: https://github.com/winstonjs/winston/blob/master/README.md

import * as fs from 'fs';
import * as path from 'path';
import * as winston from 'winston';

import appRootDir from './app-root-dir';

const simpleFormatter = (args: any): string => {
   return `${args.level}: ${args.message}`;
};

const detailedFormatter = (args: any): string => {
   return `${args.timestamp} [${args.label}] ${args.level}: ${args.message}`;
};

const getLogger = (logFile: string | undefined = undefined) => {

   const transports: winston.TransportInstance[] = [];

   if (process.env.NODE_ENV !== 'prod') {
      transports.push(new winston.transports.Console({
         colorize: true,
         formatter: simpleFormatter,
         level: 'silly',
      }));
   }

   if (logFile) {
      transports.push(new winston.transports.File({
         filename: logFile as string,
         formatter: detailedFormatter,
         json: false,
         level: 'info',
      }));
   }

   const logger = new winston.Logger({
      transports,
   });

   return logger;

};

const defaultLogger = (appPath: string) => {
   const appRoot = appRootDir();
   const logDir = path.join(appRoot, 'logs');
   if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir);
   }
   const logPath = path.join(logDir, `${Date.now()}.log`);
   return getLogger(logPath);
};

export const Logging = {
   defaultLogger,
   getLogger,
};
