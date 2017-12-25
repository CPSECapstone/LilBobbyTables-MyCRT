import { Logging } from '@lbt-mycrt/common';
import http = require('http-status-codes');
import * as mysql from 'mysql';
import SelfAwareRouter from './self-aware-router';
import ConnectionPool from './util/cnnPool';

export default class PingRouter extends SelfAwareRouter {

   public name: string = 'ping';
   public urlPrefix: string = '/ping';

   protected mountRoutes(): void {
      const logger = Logging.defaultLogger(__dirname);

      this.router.get('/', (request, response) => {
         const queryStr = mysql.format("SELECT * FROM Capture", []);
         ConnectionPool.query(response, queryStr, (error, rows, fields) => {
            response.json(rows);
         });
      });

   }

}
