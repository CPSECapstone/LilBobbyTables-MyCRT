import http = require('http-status-codes');

import SelfAwareRouter from './self-aware-router';

export default class PingRouter extends SelfAwareRouter {

   public name: string = 'ping';
   public urlPrefix: string = '/ping';

   protected mountRoutes(): void {

      this.router.get('/', this.handleHttpErrors(async (request, response) => {
         response.sendStatus(http.OK);
      }));

   }
}
