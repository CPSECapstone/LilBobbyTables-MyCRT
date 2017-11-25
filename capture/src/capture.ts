import { Logging } from '@lbt-mycrt/common';

const logger = Logging.defaultLogger(__dirname);

export interface ICaptureConfig {
   id: number;
   interval: number;

   // other config stuff can be here...

}

export class Capture {

   /** Once set to true, the capture will wrap up */
   private done: boolean = false;

   constructor(public config: ICaptureConfig) {}

   /**
    * Run the capture, setup is performed, then logs are periodically processed.
    * Once `done` is set to true, teardown will be performed.
    */
   public run(): void {

      this.setup();

      while (!this.done) {

         // TODO: sleep for this.config.interval (still have to figure this out)
         // TODO: set `done` to true by waiting for a signal from the service.

         this.processLogs();
      }

      this.teardown();

   }

   /**
    * Perform setup for the Capture. (turning on logging for the RDS instance, etc.)
    */
   private setup(): void {
      logger.info(`Performing setup for Capture ${this.config.id}`);
   }

   /**
    * Called once every `this.config.interval` milliseconds
    */
   private processLogs(): void {
      logger.info(`Capture ${this.config.id}: processing logs...`);
   }

   /**
    * Perform the teardown. For now, this'll be just scraping logs from RDS and putting them into S3.
    */
   private teardown(): void {
      logger.info(`Performing teardown for Capture ${this.config.id}`);
   }

}
