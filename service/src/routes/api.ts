import AwsKeysRouter from './aws-keys';
import CaptureRouter from './capture';
import DBReferenceRouter from './db-reference';
import EnvUserRouter from './env-user';
import EnvironmentRouter from './environment';
import PingRouter from './ping';
import ReplayRouter from './replay';
import SelfAwareRouter from './self-aware-router';
import { UserRouter } from './users';
import ValidateRouter from './validate';

export default class ApiRouter extends SelfAwareRouter {

   public name: string = 'api';
   public urlPrefix: string = '/api';

   protected mountRoutes(): void {

      const mountRouter = (router: SelfAwareRouter) => {
         this.router.use(router.urlPrefix, router.router);
      };

      mountRouter(new UserRouter(this.ipcNode));
      mountRouter(new CaptureRouter(this.ipcNode));
      mountRouter(new ReplayRouter(this.ipcNode));
      mountRouter(new PingRouter(this.ipcNode));
      mountRouter(new EnvironmentRouter(this.ipcNode));
      mountRouter(new AwsKeysRouter(this.ipcNode));
      mountRouter(new ValidateRouter(this.ipcNode));
      mountRouter(new DBReferenceRouter(this.ipcNode));
      mountRouter(new EnvUserRouter(this.ipcNode));
   }
}
