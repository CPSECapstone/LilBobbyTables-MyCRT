import { Logging } from '@lbt-mycrt/common';

const logger = Logging.getLogger(__dirname);

export default class MyCrtCli {

   constructor() {

   }

   public run() {
      logger.info("Running the MyCrtCli");
   }

}
