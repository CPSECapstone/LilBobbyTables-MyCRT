#!/usr/bin/env node

import * as express from 'express';
import * as fs from 'fs';
import { Server } from 'http';
import * as mustache from 'mustache';
import * as path from 'path';

import { Logging } from '@lbt-mycrt/common';

import * as pages from './mustache';
import ApiRouter from './routes/api';
import SelfAwareRouter from './routes/self-aware-router';

const logger = Logging.defaultLogger(__dirname);

/* tslint:disable no-var-requires */
const config = require('../mycrt.config.json');
/* tslint:enable no-var-requires */

class MyCRTService {

   public readonly DEFAULT_PORT: number = 3000;
   public readonly DEFAULT_HOST: string = 'localhost';

   public express: express.Express = express();

   private port: number | null = null;
   private host: string | null = null;
   private server: Server | null = null;

   constructor() {
      this.mountMiddlewares();
      this.mountApiRoutes();
      this.mountPageRoutes();
   }

   public getServer(): Server | null {
      return this.server;
   }

   public isLaunched(): boolean {
      return this.port !== null;
   }

   public launch(): void {

      // make sure it isn't already launched
      if (this.isLaunched()) {
         throw new Error(`MyCRT Service has already launched on port ${this.port}`);
      }

      // set the port and host
      this.port = process.env.port ? parseInt(process.env.port as string, 10) : this.DEFAULT_PORT;
      this.host = process.env.host ? process.env.host as string : this.DEFAULT_HOST;

      // configure the application
      for (const key of config) {
         this.express.set(key, config[key]);
      }

      // listen for requests
      this.server = this.express.listen(this.port, this.host, (error: any) => {
         if (error) {
            this.close();
            logger.error(error);
         }
         logger.info(`server is listening on ${this.port}`);
         logger.info("-----------------------------------------------------------");
      });

   }

   public close(): void {

      // only if already launched!
      if (!this.isLaunched()) {
         logger.info("Closing MyCRTServer");
         this.server!.close();
         this.server = null;
         this.port = null;
         this.host = null;
      }

   }

   private mountMiddlewares(): void {

      // log each request to the console
      this.express.use((request, response, then) => {
         logger.info(`----=[ ${request.method} ${request.path} ]=----`);
         then();
      });

   }

   private mountApiRoutes(): void {

      const apiRouter = new ApiRouter();
      this.express.use(apiRouter.urlPrefix, apiRouter.router);

   }

   private mountPageRoutes(): void {

      const routePage = (urlPattern: RegExp, page: pages.Template) => {
         this.express.get(urlPattern, (request, response) => {
            response.send(page.getText()).send();
         });
      };

      routePage(/^\/?$/, pages.index);
      routePage(/^\/environment\/?$/, pages.environment);
      routePage(/^\/captures\/?$/, pages.captures);
      routePage(/^\/capture\/?$/, pages.capture);
      routePage(/^\/replay\/?$/, pages.replay);
      routePage(/^\/metrics\/?$/, pages.metrics);

   }

}

if (typeof(require) !== 'undefined' && require.main === module) {

   const service = new MyCRTService();
   service.launch();

}

export default MyCRTService;
