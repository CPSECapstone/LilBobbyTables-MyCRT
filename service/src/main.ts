#!/usr/bin/env node

import * as bodyParser from 'body-parser';
import * as cookieParser from 'cookie-parser';
import * as express from 'express';
import * as fs from 'fs';
import * as helmet from 'helmet';
import { Server } from 'http';
import * as http from 'http-status-codes';
import * as https from 'https';
import * as mustache from 'mustache';
import * as path from 'path';

import { Logging, ServerIpcNode } from '@lbt-mycrt/common';
import { Pages, StaticFileDirs, Template } from '@lbt-mycrt/gui';

import * as session from './auth/session';
import { rescheduleCaptures } from './management/capture';
import { markAbandonedReplaysAsFailed } from './management/replay';
import ApiRouter from './routes/api';
import * as indexRedirect from './routes/index-redirect';
import SelfAwareRouter from './routes/self-aware-router';
import settings = require('./settings');
import { getSslOptions, sslSetupCheck } from './ssl';

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
            reject(`MyCRT Service has already launched on port ${this.port}`);
         }

         // make express
         this.express = express();
         this.mountEverything();

         // set the port and host
         this.port = process.env.MYCRT_PORT ? parseInt(process.env.MYCRT_PORT as string, 10) : this.DEFAULT_PORT;
         this.host = process.env.MYCRT_HOST ? null : this.DEFAULT_HOST;

         // configure the application
         for (const key in settings) {
            this.express.set(key, (settings as any)[key]);
         }

         // start the IpcNode
         this.ipcNode.start();

         // listen for requests
         const lauchCallback = (error: any) => {
            if (error) {
               this.close();
               logger.error(error);
            }
            logger.info(`server is listening on ${this.port}`);
            resolve(true);
         };

         // process any captures/replays that are in a bad state
         try {
            rescheduleCaptures();
            markAbandonedReplaysAsFailed();
         } catch (e) {
            logger.error(`Failed while processing captures/replays in bad states: ${e}`);
         }

         if (this.host) {
            this.server = this.express.listen(this.port, this.host, lauchCallback);
         } else {
            this.server = this.express.listen(this.port, lauchCallback);
         }

         if (settings.settings.ssl) {
            logger.info(`Enabling SSL`);
            const sslSetupOk: boolean = sslSetupCheck();
            if (!sslSetupOk) {
               reject("Could not setup with SSL");
            }
            https.createServer(getSslOptions(), this.express).listen(443);
         } else {
            logger.info(`Not Enabling SSL`);
         }

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

      // remove (redirect) trailing slashes
      this.express!.use((request, response, next) => {
         if (request.path.substr(-1) === '/' && request.path.length > 1) {
            const newPath = request.path.slice(0, -1);
            const query = request.url.slice(request.path.length);
            response.redirect(http.PERMANENT_REDIRECT, `${newPath}${query}`);
         } else {
            next();
         }
      });

      // prevent click jacking
      this.express!.use(helmet());

      // parsing
      this.express!.use(cookieParser());
      this.express!.use(bodyParser.json());

      // user session management
      this.express!.use(session.Session.sessionMiddleware);
   }

   private mountApiRoutes(): void {

      const apiRouter = new ApiRouter(this.ipcNode);
      this.express!.use(apiRouter.urlPrefix, apiRouter.router);

   }

   private mountStaticFileRoutes(): void {

      const staticFilesDir = path.resolve(__dirname, '..', 'static');
      logger.info(`Service static files being served from ${staticFilesDir}`);
      this.express!.use('/', express.static(staticFilesDir));

      // TODO: lock down CORS
      logger.info(`GUI static files and bundles being served from ${StaticFileDirs.js}`);
      this.express!.use('/', express.static(StaticFileDirs.js));

   }

   private mountPageRoutes(): void {

      this.express!.get(/^\/$/, session.loggedIn, indexRedirect.indexRouteHandler);

      const routePage = (urlPattern: RegExp, page: Template,
            login?: express.RequestHandler) => {
         if (!login) {
            this.express!.get(urlPattern,
               (request, response) => {
                  response.send(page.getText()).end();
               },
            );
         } else {
            this.express!.get(urlPattern,
               login!,
               (request: express.Request, response: express.Response) => {
                  response.send(page.getText()).end();
               },
            );
         }
      };

      routePage(/^\/signup$/, Pages.signup);
      routePage(/^\/login$/, Pages.login);

      routePage(/^\/account$/, Pages.account, session.loggedIn);
      routePage(/^\/environments$/, Pages.environments, session.loggedIn);
      routePage(/^\/dashboard$/, Pages.dashboard, session.loggedIn);
      routePage(/^\/captures$/, Pages.captures, session.loggedIn);
      routePage(/^\/capture$/, Pages.capture, session.loggedIn);
      routePage(/^\/replay$/, Pages.replay, session.loggedIn);
      routePage(/^\/metrics$/, Pages.metrics, session.loggedIn);

   }
}

if (typeof(require) !== 'undefined' && require.main === module) {

   const service = new MyCrtService();
   service.launch();

}

export default MyCrtService;
