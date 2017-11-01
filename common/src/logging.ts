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

   const logger = new winston.Logger({
      transports: [

         // TODO: don't log to the console in production
         new winston.transports.Console({
            colorize: true,
            formatter: simpleFormatter,
            level: 'silly',
         }),

         new winston.transports.File({
            filename: logFile,
            formatter: detailedFormatter,
            level: 'info',
         }),

      ],
   });

   return logger;

};

export const Logging = {
   getLogger,
};
