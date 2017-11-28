import { Request, Response, Router } from 'express';

import { ServerIpcNode } from '@lbt-mycrt/common';

export default abstract class SelfAwareRouter {

   public abstract name: string;
   public abstract urlPrefix: string;
   public readonly router: Router;

   public constructor(protected ipcNode: ServerIpcNode) {
      this.router = Router();
      this.mountRoutes();
   }

   protected abstract mountRoutes(): void;

}
