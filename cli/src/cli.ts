import { Logging } from '@lbt-mycrt/common';

export default class MyCrtCli {

   private logger = Logging.getLogger(true, Logging.rawFormatter, undefined, undefined);

   constructor() {}

   public run() {
      this.print("Running CLI!!!");
   }

   private print(msg: string, level?: Logging.LogLevel): void {

      const logFunc = Logging.getLoggingFunction(this.logger, level);
      logFunc(msg);

   }

}
