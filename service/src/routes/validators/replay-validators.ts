import { CustomValidator } from 'express-validator/check';
import * as mysql from 'mysql';

import { Logging } from '@lbt-mycrt/common';

import ConnectionPool from '../util/cnnPool';

const logger = Logging.defaultLogger(__dirname);

export const captureExists: CustomValidator = (id, options) => {
   const queryStr = mysql.format('SELECT * FROM Capture WHERE id = ?', [id]);
   return ConnectionPool.plainQuery(queryStr).then((rows) => {
      if (!rows.length) {
         throw new Error("Invalid captureId");
      }
      return true;
   });
};
