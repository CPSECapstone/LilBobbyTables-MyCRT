import moment = require('moment');

export const dateToMysqlFormat = (date: Date): string => {
   return moment(date).format('YYYY-MM-DD HH:mm:ss');
};

export const sleep = (ms: number): Promise<void> => {
   ms = ms < 0 ? 0 : ms;
   return new Promise((resolve, reject) => {
      setTimeout(() => {
         resolve();
      }, ms);
   });
};

export const syncTimeout = (func: () => Promise<any>, ms: number) => {
   return new Promise<void>((resolve, reject) => {
      setTimeout(async () => {
         await func();
         resolve();
      }, ms);
   });
};
