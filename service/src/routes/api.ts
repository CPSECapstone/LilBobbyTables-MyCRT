import CaptureRouter from './capture';
import ReplayRouter from './replay';
import SelfAwareRouter from './self-aware-router';

export default class ApiRouter extends SelfAwareRouter {

   public name: string = 'api';
   public urlPrefix: string = '/api';

   protected mountRoutes(): void {

      const mountRouter = (router: SelfAwareRouter) => {
         this.router.use(router.urlPrefix, router.router);
      };

      mountRouter(new CaptureRouter());
      mountRouter(new ReplayRouter());

   }

}
