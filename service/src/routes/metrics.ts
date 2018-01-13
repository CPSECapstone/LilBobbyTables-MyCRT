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
      .get('/', (request, response) => {
         response.sendStatus(200);
      });
   }
}
