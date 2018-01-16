#!/usr/bin/env node

import * as bodyParser from 'body-parser';
import * as express from 'express';
import * as fs from 'fs';
import { Server } from 'http';
import * as mustache from 'mustache';
import * as path from 'path';

import { Logging, ServerIpcNode } from '@lbt-mycrt/common';
import { Pages, StaticFileDirs, Template } from '@lbt-mycrt/gui';

import ApiRouter from './routes/api';
import SelfAwareRouter from './routes/self-aware-router';

const logger = Logging.defaultLogger(__dirname);

/* tslint:disable no-var-requires */
const config = require('../mycrt.config.json');
/* tslint:enable no-var-requires */

class MyCrtService {

   public readonly DEFAULT_PORT: number = 3000;
   public readonly DEFAULT_HOST: string = 'localhost';

   public express: express.Express | null = null;

   private port: number | null = null;
   private host: string | null = null;
   private server: Server | null = null;

   private ipcNode = new ServerIpcNode(logger);

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

      // make express
      this.express = express();
      this.mountEverything();

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

      // start the IpcNode
      this.ipcNode.start();

   }

   public close(callback?: () => void | undefined): void {

      // only if already launched!
      if (this.isLaunched()) {
         logger.info("Closing MyCRTServer");
         this.server!.close(callback);
         this.server = null;
         this.port = null;
         this.host = null;
         this.express = null;
         this.ipcNode.stop();
      }

   }

   private mountEverything(): void {
      this.mountBodyParser();
      this.mountMiddlewares();
      this.mountApiRoutes();
      this.mountStaticFileRoutes();
      this.mountPageRoutes();
   }

   private mountBodyParser(): void {
      this.express!.use(bodyParser.json());
   }

   private mountMiddlewares(): void {

      // log each request to the console
      this.express!.use((request, response, then) => {
         logger.info(`----=[ ${request.method} ${request.path} ]=----`);
         /* TODO: Add MySQL connection here */
         then();
      });

   }

   private mountApiRoutes(): void {

      const apiRouter = new ApiRouter(this.ipcNode);
      this.express!.use(apiRouter.urlPrefix, apiRouter.router);

   }

   private mountStaticFileRoutes(): void {

      // logger.info(`CSS being served from ${StaticFileDirs.css}`);
      // this.express!.use('/css', express.static(StaticFileDirs.css));

      logger.info(`JS being served from ${StaticFileDirs.js}`);
      this.express!.use('/js', express.static(StaticFileDirs.js));

   }

   private mountPageRoutes(): void {

      const routePage = (urlPattern: RegExp, page: Template) => {
         this.express!.get(urlPattern, (request, response) => {
            response.send(page.getText()).end();
         });
      };

      routePage(/^\/?$/, Pages.index);
      routePage(/^\/environments\/?$/, Pages.environments);
      routePage(/^\/dashboard\/?$/, Pages.dashboard);
      routePage(/^\/captures\/?$/, Pages.captures);
      routePage(/^\/capture\/?$/, Pages.capture);
      routePage(/^\/replay\/?$/, Pages.replay);
      routePage(/^\/metrics\/?$/, Pages.metrics);

   }
}

if (typeof(require) !== 'undefined' && require.main === module) {

   const service = new MyCrtService();
   service.launch();

}

export default MyCrtService;
