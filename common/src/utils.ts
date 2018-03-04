import moment = require('moment');

export const dateToMysqlFormat = (date: Date): string => {
   return moment(date).format('YYYY-MM-DD HH:mm:ss');
};
