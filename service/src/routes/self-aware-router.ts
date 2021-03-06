import { NextFunction, Request, RequestHandler, Response, Router } from 'express';
import http = require('http-status-codes');
import * as joi from 'joi';

import { Logging, ServerIpcNode } from '@lbt-mycrt/common';

import { HttpError } from '../http-error';
import { IErrorItem } from '../middleware/request-validation';

const logger = Logging.defaultLogger(__dirname);

export default abstract class SelfAwareRouter {

   public abstract name: string;
   public abstract urlPrefix: string;
   public readonly router: Router;

   public constructor(protected ipcNode: ServerIpcNode, middlewares?: RequestHandler[]) {
      this.router = Router();

      if (middlewares) {
         for (const middleware of middlewares) {
            this.router.use(middleware);
         }
      }

      this.mountRoutes();
   }

   protected abstract mountRoutes(): void;

   protected handleHttpErrors(handler: RequestHandler): RequestHandler {
      return async (request, response, next) => {

         [
            ['params', request.params],
            ['query ', request.query],
            ['body  ', request.body],
         ].forEach((value) => {
            if (Object.keys(value[1]).length) {
               logger.info("request." + value[0] + " = " + JSON.stringify(value[1]));
            }
         });

         try {
            await handler(request, response, next);
         } catch (error) {
            logger.error(error);
            let info: IErrorItem;

            if (error.IS_HTTP_ERROR === true) {
               const httpError = error as HttpError;
               info = {code: httpError.code, message: httpError.message};
               response.status(httpError.code).json(info);
            } else {
               info = {code: http.INTERNAL_SERVER_ERROR, message: error.message || error};
               response.status(http.INTERNAL_SERVER_ERROR).json(info);
            }

         }
      };
   }

}
