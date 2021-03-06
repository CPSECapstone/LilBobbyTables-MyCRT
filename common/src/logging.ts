// documentation: https://github.com/winstonjs/winston/blob/master/README.md

import * as fs from 'fs';
import * as path from 'path';
import * as winston from 'winston';

import appRootDir from './app-root-dir';

/** The possible levels for logging */
export enum LogLevel { SILLY = 5, DEBUG = 4, VERBOSE = 3, INFO = 2, WARN = 1, ERROR = 0 }

export declare type FormatFunction = (args: any) => string;

export const rawFormatter: FormatFunction = (args: any): string => {
   return `${args.message}`;
};

export const noopFormatter: FormatFunction = (args: any): string => {
   return args.message;
};

export const detailedFormatter: FormatFunction = (args: any): string => {
   return `${args.timestamp()} [${args.label}] ${args.level}: ${args.message}`;
};

/** Retrieves a logger's logging function at the specified level. */
export const getLoggingFunction = (logger: winston.LoggerInstance, level?: LogLevel): (msg: string) => void => {

   if (level !== undefined) {
      switch (level) {
      case LogLevel.SILLY:
         return logger.silly;
      case LogLevel.DEBUG:
         return logger.debug;
      case LogLevel.VERBOSE:
         return logger.verbose;
      case LogLevel.INFO:
         return logger.info;
      case LogLevel.WARN:
         return logger.warn;
      case LogLevel.ERROR:
         return logger.error;
      default:
         return logger.silly;
      }
   } else {
      return logger.info;
   }

};

/** Gets a Logger that optionally writes to the console and writes to the specified file if provided. */
export const getLogger = (console?: boolean, consoleFormat?: FormatFunction, logFile?: string,
      logFormat?: FormatFunction, name?: string) => {

   const transports: winston.TransportInstance[] = [];

   if (console) {
      transports.push(new winston.transports.Console({
         colorize: true,
         formatter: consoleFormat,
         level: 'silly',
         silent: process.env.NODE_ENV === 'test',
      }));
   }

   const tsFormat = () => (new Date()).toLocaleString();
   if (logFile) {
      transports.push(new winston.transports.File({
         colorize: false,
         filename: logFile as string,
         formatter: logFormat,
         json: false,
         level: 'info',
         silent: process.env.NODE_ENV === 'test',
         timestamp: tsFormat,
         label: name || ' -- ',
      }));
   }

   const logger = new winston.Logger({
      transports,
   });

   return logger;
};

/** builds a default logger, use getLogger for more control. */
export const defaultLogger = (appPath: string) => {
   const appRoot = appRootDir();
   const logDir = path.join(appRoot, 'logs');
   if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir);
   }
   const date = new Date();
   const day = `${date.getFullYear()}-${date.getMonth()}-${date.getDay()}`;
   const logPath = path.join(logDir, `${day}.log`);
   return getLogger(true, undefined, logPath, detailedFormatter, appPath);
};

export const noopLogger = (appPath: string) => {
   const appRoot = appRootDir();
   const logDir = path.join(appRoot, 'logs');
   if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir);
   }
   const date = new Date();
   const day = `${date.getFullYear()}-${date.getMonth()}-${date.getDay()}`;
   const logPath = path.join(logDir, `${day}.log`);
   return getLogger(true, noopFormatter, logPath, detailedFormatter, appPath);
};

export const consoleLogger = () => {
   return getLogger(true);
};
