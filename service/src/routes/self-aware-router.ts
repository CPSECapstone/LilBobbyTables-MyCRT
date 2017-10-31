import { Request, Response, Router } from 'express';

export default abstract class SelfAwareRouter {

   public abstract name: string;
   public abstract urlPrefix: string;
   public readonly router: Router;

   public constructor() {
      this.router = Router();
      this.mountRoutes();
   }

   protected abstract mountRoutes(): void;

}
