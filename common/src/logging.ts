// documentation: https://github.com/winstonjs/winston/blob/master/README.md

import * as fs from 'fs';
import * as winston from 'winston';

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
         filename: logFile,
         formatter: detailedFormatter,
         level: 'info',
      }));
   }

   const logger = new winston.Logger({
      transports,
   });

   return logger;

};

export const Logging = {
   getLogger,
};
