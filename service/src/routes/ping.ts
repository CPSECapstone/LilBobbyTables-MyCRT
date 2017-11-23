import http = require('http-status-codes');

import SelfAwareRouter from './self-aware-router';

export default class PingRouter extends SelfAwareRouter {

   public name: string = 'ping';
   public urlPrefix: string = '/ping';

   protected mountRoutes(): void {

      this.router.get('/', (request, response) => {
         response.status(http.OK).end();
      });

   }

}
