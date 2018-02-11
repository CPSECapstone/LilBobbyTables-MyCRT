import CaptureRouter from './capture';
import EnvironmentRouter from './environment';
import PingRouter from './ping';
import ReplayRouter from './replay';
import SelfAwareRouter from './self-aware-router';

export default class ApiRouter extends SelfAwareRouter {

   public name: string = 'api';
   public urlPrefix: string = '/api';

   protected mountRoutes(): void {

      const mountRouter = (router: SelfAwareRouter) => {
         this.router.use(router.urlPrefix, router.router);
      };

      mountRouter(new CaptureRouter(this.ipcNode));
      mountRouter(new ReplayRouter(this.ipcNode));
      mountRouter(new PingRouter(this.ipcNode));
      mountRouter(new EnvironmentRouter(this.ipcNode));
   }

}
