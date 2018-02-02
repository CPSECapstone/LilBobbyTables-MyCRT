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
import settings = require('./settings');

const logger = Logging.defaultLogger(__dirname);

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

   public setting(key: string): any {
      if (this.express === null) {
         return undefined;
      }
      return this.express.get(key);
   }

   public launch(): Promise<boolean> {

      return new Promise<boolean>(async (resolve, reject) => {

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
         for (const key in settings) {
            this.express.set(key, (settings as any)[key]);
         }

         // start the IpcNode
         this.ipcNode.start();

         // listen for requests
         this.server = this.express.listen(this.port, this.host, (error: any) => {
            if (error) {
               this.close();
               logger.error(error);
            }
            logger.info(`server is listening on ${this.port}`);
            logger.info("-----------------------------------------------------------");
            resolve(true);
         });

      });

   }

   public close(): Promise<boolean> {
      return new Promise<boolean>(async (resolve, reject) => {

         // only if already launched!
         if (this.isLaunched()) {
            logger.info("Closing MyCRTServer");
            this.port = null;
            this.host = null;
            this.express = null;
            await this.ipcNode.stop();
            this.server!.close(() => {
               this.server = null;
               resolve(true);
            });
         } else {
            throw new Error(`MyCRT has not launched yet`);
         }

      });

   }

   private mountEverything(): void {
      this.mountMiddlewares();
      this.mountApiRoutes();
      this.mountStaticFileRoutes();
      this.mountPageRoutes();
   }

   private mountMiddlewares(): void {

      this.express!.use(bodyParser.json());

      // log each request to the console
      this.express!.use((request, response, then) => {
         let paramsStr: string = '';
         if (Object.keys(request.query).length) {
            paramsStr = ` ${JSON.stringify(request.query)}`;
         }
         logger.info(`----=[ ${request.method} ${request.path}${paramsStr} ]=----`);
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

      logger.info(`Bundles being served from ${StaticFileDirs.js}`);
      this.express!.use('/', express.static(StaticFileDirs.js));

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
