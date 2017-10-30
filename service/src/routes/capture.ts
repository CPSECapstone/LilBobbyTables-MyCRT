import * as http from 'http-status-codes';

import SelfAwareRouter from './self-aware-router';

import launchCapture from '@lbt-mycrt/capture/dist/launch';

export default class CaptureRouter extends SelfAwareRouter {
   public name: string = 'capture';
   public urlPrefix: string = '/capture';

   protected mountRoutes(): void {
      this.router

         .get('/', (request, response) => {
            response
               .json(['capture1', 'capture2', 'capture3'])
               .end()
            ;
         })

         .get('/:id', (request, response) => {
            const id = request.params.id;
            response
               .send(`capture${id}`)
               .end()
            ;
         })

         .post('/', (request, response) => {
            launchCapture();
            const id = "[ID]";
            response
               .status(http.OK)
               .location(`${this.urlPrefix}/${id}`)
               .end()
            ;
         })

      ;
   }
}