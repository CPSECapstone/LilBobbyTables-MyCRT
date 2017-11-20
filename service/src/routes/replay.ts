import SelfAwareRouter from './self-aware-router';

export default class ReplayRouter extends SelfAwareRouter {
   public name: string = 'replay';
   public urlPrefix: string = '/replay';

   protected mountRoutes(): void {
      this.router
         .get('/', (request, response) => {
            response
               .json(['replay1', 'replay2'])
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
      ;
   }
}
