import { Request, RequestHandler, Response, Router } from 'express';
import http = require('http-status-codes');

import { Logging, ServerIpcNode } from '@lbt-mycrt/common';

import { IErrorItem } from '../middleware/request-validation';

const logger = Logging.defaultLogger(__dirname);

export default abstract class SelfAwareRouter {

   public abstract name: string;
   public abstract urlPrefix: string;
   public readonly router: Router;

   public constructor(protected ipcNode: ServerIpcNode) {
      this.router = Router();
      this.mountRoutes();
   }

   protected abstract mountRoutes(): void;

   protected tryCatch500(handler: RequestHandler): RequestHandler {
      return (request, response, next) => {
         try {
            handler(request, response, next);
         } catch (error) {
            logger.error(error);
            const info: IErrorItem = {message: error};
            response.status(http.INTERNAL_SERVER_ERROR).json(info);
         }
      };
   }

}
