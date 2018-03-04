import md5 = require('md5');

import { IChildProgram, ICommand, IWorkload, Logging } from '@lbt-mycrt/common';
import { StorageBackend } from '@lbt-mycrt/common/dist/storage/backend';
import { FragmentType, path as schema } from '@lbt-mycrt/common/dist/storage/backend-schema';
import { FragmentedStorage } from '@lbt-mycrt/common/dist/storage/fragmented-storage';

const logger = Logging.defaultLogger(__dirname);

export class WorkloadStorage extends FragmentedStorage<IWorkload> {

   public static hash(c: ICommand): string {
      return md5(`${c.server_id}${c.thread_id}${c.user_host}${c.event_time}${c.command_type}${c.argument}`);
   }

   constructor(backend: StorageBackend) {
      super(FragmentType.WORKLOAD, backend);
   }

   public async buildFinalWorkloadFile(childProgram: IChildProgram) {
      const workload = await this.read(childProgram, false);
      const key = schema.workload.getDoneKey(childProgram);
      logger.info(`Writing final workload to ${key}`);
      await this.backend.writeJson(key, workload);
   }

   protected getDefaultObject(): IWorkload {
      return {
         start: '',
         end: '',
         commands: [],
      };
   }

   protected mergeObjects(a: IWorkload, b: IWorkload): IWorkload {
      const start = new Date(a.start).getTime() < new Date(b.start).getTime() ? a.start : b.start;
      const end = new Date(a.end).getTime() < new Date(b.end).getTime() ? a.end : b.end;

      const map: {[key: string]: ICommand | undefined} = {};
      [a, b].forEach((workload: IWorkload) => {
         workload.commands.forEach((command: ICommand) => {
            this.ensureHash(command);
            const current = map[command.hash!];
            if (current) {
               logger.info(`Received conflicting commands in the workloads.`);
            }
            map[command.hash!] = command;
         });
      });

      const commands = this.buildSortedCommands(map as {[key: string]: ICommand});

      return {start, end, commands};
   }

   private ensureHash(command: ICommand) {
      if (command.hash) {
         return;
      }
      command.hash = WorkloadStorage.hash(command);
   }

   private buildSortedCommands(map: {[key: string]: ICommand}): ICommand[] {
      const list = Object.keys(map).map((key) => map[key]);
      list.sort((a: ICommand, b: ICommand) => {
         const aDate = new Date(a.event_time);
         const bDate = new Date(b.event_time);
         return aDate.getTime() - bDate.getTime();
      });
      return list;
   }

}
