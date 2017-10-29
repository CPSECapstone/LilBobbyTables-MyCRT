#!/usr/bin/env node

import * as express from 'express';
import * as path from 'path';

class MyCRTService {
   public readonly DEFAULT_PORT: number = 3000;

   public express: express.Express = express();

   private port: number | null = null;
   private publicPath: string = path.resolve(__dirname, '../public');

   constructor() {
      this.mountRoutes();
   }

   public launch(): void {
      if (this.port) {
         throw new Error(`MyCRT Service has already launched on port ${this.port}`);
      }

      // set the port
      this.port = process.env.port ? parseInt(process.env.port as string, 10) : this.DEFAULT_PORT;

      // listen for requests
      this.express.listen(this.port, (error: any) => {
         if (error) {
            this.port = null;
            console.error(error);
         }
         console.log(`server is listening on ${this.port}`);
         console.log(`  serving public files from ${this.publicPath}`);
      });
   }

   private mountRoutes(): void {
      this.express.use('/', (request, response) => {
         response.sendFile('html/index.html', {
            root: this.publicPath,
         });
      });
   }
}

const service = new MyCRTService();
service.launch();
