import { ChildProgramStatus, ChildProgramType, ICapture, ICommand, IDbReference, IReplay,
   IWorkload, Logging} from '@lbt-mycrt/common';

import { environmentDao } from '../dao';
import { replayDao } from './dao';

const logger = Logging.defaultLogger(__dirname);

export class ReplayManager {

   protected replay: IReplay = {type: ChildProgramType.REPLAY};
   protected db: IDbReference = {};
   protected started: boolean = false;
   protected commandPromises: Array<Promise<void>> = [];

   constructor(private replayId: number) {}

   public get hasStarted() { return this.started; }

   public async loadReplay(): Promise<boolean> {
      const r = await replayDao.getReplay(this.replayId);
      if (r === null) { return false; }

      const db = await environmentDao.getDbReference(r.dbId!);
      if (db === null) { return false; }

      logger.info(`Setting replay ${this.replayId} status to starting`);
      await replayDao.updateReplayStatus(this.replayId, ChildProgramStatus.STARTING);

      this.replay = r;
      this.db = db;
      return true;
   }

   public async start() {
      logger.info(`Setting replay ${this.replayId} start time`);
      await replayDao.updateReplayStartTime(this.replayId);

      logger.info(`Setting replay ${this.replayId} to running`);
      await replayDao.updateReplayStatus(this.replayId, ChildProgramStatus.RUNNING);

      this.started = true;
   }

   public async end() {
      logger.info(`Setting replay ${this.replayId} status to done`);
      await replayDao.updateReplayStatus(this.replayId, ChildProgramStatus.DONE);

      logger.info(`Setting replay ${this.replayId} end time`);
      await replayDao.updateReplayEndTime(this.replayId);
   }

   public async processWorkloadFragment(workloadFragment: IWorkload) {
      logger.info(`Processing workload fragment`);

      for (const command of workloadFragment.commands) {
         this.commandPromises.push(this.processCommand(command));
      }
   }

   public async dontPanic(reason: string): Promise<void> {
      return replayDao.updateReplayStatus(this.replayId, ChildProgramStatus.FAILED, reason);
   }

   public async finishAllCommands() {
      return Promise.all(this.commandPromises);
   }

   protected async processCommand(command: ICommand) {

      // TODO

   }

}
