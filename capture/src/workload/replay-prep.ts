import { ICommand, IWorkload, Logging } from '@lbt-mycrt/common';

const logger = Logging.defaultLogger(__dirname);

const mockFilter = (command: ICommand): boolean => {
   let good = true;
   ["UPDATE CAPTURE", "UPDATE DBREFERENCE", "UPDATE ENVIRONMENT", "UPDATE IAMREFERENCE",
         "UPDATE REPLAY", "UPDATE S3REFERENCE"].forEach((segment) => {
      good = good && command.argument.toUpperCase().indexOf(segment) < 0;
   });
   return good;
};

const convertTime = (command: ICommand): ICommand => {
   logger.info(`      * event time: ${command.event_time}`);
   return command;
};

export const prepareWorkload = (workload: IWorkload, mock: boolean) => {
   logger.info(`   * Preparing Workload`);

   let pre;
   let post;

   // filter commands
   if (mock) {
      logger.info(`      * Only Dummy Queries in mock mode!`);
      pre = workload.commands.length;
      workload.commands = workload.commands.filter(mockFilter);
      post = workload.commands.length;
      logger.info(`      ${pre} -> ${post}`);
   }

   // transform commands
   logger.info(`      * Convert time`);
   pre = workload.commands.length;
   workload.commands = workload.commands.map(convertTime);
   post = workload.commands.length;
   logger.info(`         ${pre} -> ${post}`);
};
