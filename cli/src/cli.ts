import fetch from 'node-fetch';

import { ICapture, IEnvironment, IReplay, Logging } from '@lbt-mycrt/common';

import { MyCrtClient } from './mycrt-client/client';
import { IMyCrtClientDelegate } from './mycrt-client/client-delegate';

export default class MyCrtCli {

   private logger = Logging.getLogger(true, Logging.rawFormatter, undefined, undefined);

   private mycrt: MyCrtClient;

   constructor() {
      this.mycrt = new MyCrtClient('localhost:3000', {
         fetch,
         logger: this.logger,
         onError: this.clientError,
      });
   }

   public async run() {

      // get all of the captures
      const captures: ICapture[] | null = await this.mycrt.getCaptures();
      if (captures === null) {
         this.logger.warn("Failed to get captures");
         return;
      }

      // print them
      this.print(`Found ${captures.length} captures`);
      for (const capture of captures) {
         this.print(`capture ${capture.id}`);
         this.print(`   name = ${capture.name}`);
         this.print(`   start = ${capture.start}`);
         this.print(`   end = ${capture.end}`);
      }
      if (captures.length <= 0) {
         return;
      }

      // get a single capture
      this.print("\nGetting a specific capture");
      const theCapture: ICapture | null = await this.mycrt.getCapture(captures[0].id!);
      if (theCapture === null) {
         this.print("Failed to get theCapture");
         return;
      }
      this.print(`Got Capture! ${JSON.stringify(theCapture)}`);

   }

   private print(msg: string, level?: Logging.LogLevel): void {

      const logFunc = Logging.getLoggingFunction(this.logger, level);
      logFunc(msg);

   }

   private clientError(reason: any): void {
      this.print(JSON.stringify(reason), Logging.LogLevel.ERROR);
   }

}
