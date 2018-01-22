import { Logging } from '@lbt-mycrt/common';
import * as http from 'http-status-codes';
import * as mysql from 'mysql';
import SelfAwareRouter from './self-aware-router';
import ConnectionPool from './util/cnnPool';

export default class Metricrouter extends SelfAwareRouter {
   public name: string = 'metric';
   public urlPrefix: string = '/metrics';

   protected mountRoutes(): void {
      const logger = Logging.defaultLogger(__dirname);

      this.router
      .get('/:type/:id', (request, response) => {
         const id = request.params.id;
         const type = (request.params.type === "capture") ? "Capture" : "Replay";

         const queryStr = mysql.format("SELECT status FROM ? WHERE id = ?", []);
         ConnectionPool.query(response, queryStr, (error, results, fields) => {
            if (results[0] === "live") {
               // call a function to retrieve metrics
            } else {
               // pull the metrics from s3
            }
            response.json();
         });
      });
   }
}
