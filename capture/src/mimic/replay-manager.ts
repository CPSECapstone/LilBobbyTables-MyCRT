import * as moment from 'moment';
import mysql = require('mysql');

import { ChildProgramStatus, ChildProgramType, ICapture, ICommand, IDbReference, IReplay,
   IWorkload, Logging, mycrtDbConfig } from '@lbt-mycrt/common';

import { environmentDao } from '../dao';
import { replayDao } from './dao';

const logger = Logging.defaultLogger(__dirname);

export class ReplayManager {

   protected replay: IReplay = {type: ChildProgramType.REPLAY};
   protected db: IDbReference = {};
   protected dbConfig: mysql.ConnectionConfig = {};
   protected started: boolean = false;
   protected commandPromises: Array<Promise<void>> = [];
   protected startTime: moment.Moment = moment();

   constructor(protected replayId: number, protected mock: boolean) {}

   public get hasStarted() { return this.started; }

   public async loadReplay(): Promise<boolean> {
      const r = await replayDao.getReplay(this.replayId);
      if (r === null) { return false; }

      const db = await environmentDao.getDbReference(r.dbId!);
      if (db === null) { return false; }

      this.replay = r;
      this.db = db;
      this.dbConfig = this.mock ? mycrtDbConfig : {
         database: db.name,
         host: db.host,
         password: db.pass,
         user: db.user,
      };

      try {
         // test the connection
         await this.doQuery();
      } catch (e) {
         this.dontPanic(e);
         return false;
      }

      logger.info(`Setting replay ${this.replayId} status to starting`);
      await replayDao.updateReplayStatus(this.replayId, ChildProgramStatus.STARTING);

      return true;
   }

   public async start() {
      logger.info(`Setting replay ${this.replayId} start time`);
      this.startTime = moment();
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

   public async processWorkloadFragment(capture: ICapture, workloadFragment: IWorkload) {
      logger.info(`Processing workload fragment`);

      for (const command of workloadFragment.commands) {
         this.commandPromises.push(this.processCommand(capture, command));
      }
   }

   public async dontPanic(reason: string): Promise<void> {
      return replayDao.updateReplayStatus(this.replayId, ChildProgramStatus.FAILED, reason);
   }

   public async finishAllCommands() {
      return Promise.all(this.commandPromises);
   }

   protected processCommand = (capture: ICapture, command: ICommand) => new Promise<void>((resolve, reject) => {

      // first, get the delta time until the command should be run
      let t: moment.Moment = moment(command.event_time);
      if (!this.mock) { t = t.add(7, 'hours'); }

      const queryOffset = t.diff(capture.start);
      if (queryOffset < 0) {
         reject("Command Query happened before the capture start!!!");
      }

      const nowReplayOffset = moment().diff(this.startTime);
      if (nowReplayOffset < 0) {
         reject("The replay started in the future ?!?!?!");
      }

      let delta = queryOffset - nowReplayOffset;
      if (delta < 0) { delta = 0; }

      // process at the correct time
      setTimeout(async () => {
         await this.doQuery(command);
         resolve();
      }, delta);
   })

   protected async doQuery(command?: ICommand) {
      const cmdInfo = command ? command.argument.substr(0, 20) + '...' : 'connect';
      logger.info(`--- Replay ${this.replayId} is performing command ${cmdInfo} ---`);
      const conn = mysql.createConnection(this.dbConfig);
      return new Promise<void>((resolve, reject) => {
         conn.connect((connErr) => {
            if (connErr) {
               reject();
               return;
            }
            if (command) {
               conn.query(command.argument, (queryErr) => {
                  conn.end();
                  if (queryErr) {
                     reject();
                     return;
                  }
                  resolve();
               });
            } else {
               conn.end();
               resolve();
            }
         });
      });
   }

}
