#!/usr/bin/env node

import * as express from 'express';
import { Server } from 'http';
import * as path from 'path';

import { Logging } from '@lbt-mycrt/common';

import CaptureRouter from './routes/capture';
import ReplayRouter from './routes/replay';
import SelfAwareRouter from './routes/self-aware-router';

const logger = Logging.defaultLogger(__dirname);

class MyCRTService {
   public readonly DEFAULT_PORT: number = 3000;
   public readonly DEFAULT_HOST: string = 'localhost';

   public express: express.Express = express();

   private port: number | null = null;
   private host: string | null = null;
   private server: Server | null = null;

   private publicPath: string = path.resolve(__dirname, '../public');

   constructor() {
      this.mountMiddlewares();
      this.mountRoutes();
   }

   public getServer(): Server | null {
      return this.server;
   }

   public launch(): void {
      if (this.port) {
         throw new Error(`MyCRT Service has already launched on port ${this.port}`);
      }

      // set the port and host
      this.port = process.env.port ? parseInt(process.env.port as string, 10) : this.DEFAULT_PORT;
      this.host = process.env.host ? process.env.host as string : this.DEFAULT_HOST;

      // listen for requests
      this.server = this.express.listen(this.port, this.host, (error: any) => {
         if (error) {
            this.port = null;
            this.host = null;
            logger.error(error);
         }
         logger.info(`server is listening on ${this.port}`);
         logger.info(`serving public files from ${this.publicPath}`);
      });
   }

   public close(): void {
      if (this.server !== null) {
         logger.info("Closing MyCRTServer");
         this.server.close();
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

   private mountRoutes(): void {

      const mountRouter = (router: SelfAwareRouter): void => {
         this.express.use(router.urlPrefix, router.router);
      };
      mountRouter(new ReplayRouter());
      mountRouter(new CaptureRouter());

      this.express.use('/', (request, response) => {
         response.sendFile('html/index.html', {
            root: this.publicPath,
         });
      });

   }
}

if (typeof(require) !== 'undefined' && require.main === module) {
   const service = new MyCRTService();
   service.launch();
}

export default MyCRTService;
