import * as moment from 'moment';
import mysql = require('mysql');

import { ByteToMegabyte, ChildProgramStatus, ChildProgramType, ICapture, ICommand, IDbReference,
   IMetricsList, IReplay, IWorkload, Logging, MetricsBackend, MetricsHash, MetricType,
   mycrtDbConfig } from '@lbt-mycrt/common';
import { MetricsStorage } from '@lbt-mycrt/common/dist/metrics/metrics-storage';
import { StorageBackend } from '@lbt-mycrt/common/dist/storage/backend';
import { path as schema } from '@lbt-mycrt/common/dist/storage/backend-schema';

import { environmentDao } from '../dao';
import { MimicConfig } from './args';
import { replayDao } from './dao';

const logger = Logging.defaultLogger(__dirname);

export class ReplayManager {

   protected replay: IReplay = {type: ChildProgramType.REPLAY};
   protected db: IDbReference = {};
   protected dbConfig: mysql.ConnectionConfig = {};
   protected started: boolean = false;
   protected commandPromises: Array<Promise<void>> = [];
   protected metricsPromises: Array<Promise<void>> = [];
   protected startTime: moment.Moment = moment();

   protected metrics: MetricsBackend | null = null;

   constructor(protected replayId: number, protected config: MimicConfig,
      protected storage: StorageBackend, protected captureMetrics: MetricsBackend) {}

   public get id() { return this.replayId; }

   public get hasStarted() { return this.started; }

   public async loadReplay(): Promise<boolean> {
      const r = await replayDao.getReplay(this.replayId);
      if (r === null) { return false; }
      r.envId = this.config.envId;

      const db = await environmentDao.getDbReference(r.dbId!);
      if (db === null) { return false; }

      this.replay = r;
      this.db = db;
      this.dbConfig = this.config.mock ? mycrtDbConfig : {
         database: db.name,
         host: db.host,
         password: db.pass,
         user: db.user,
      };
      this.metrics = this.captureMetrics.cloneForInstance(this.db.instance!);

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

   public async finishAllMetrics() {
      return Promise.all(this.metricsPromises);
   }

   public retrieveMetrics() {
      logger.info(`Getting metrics for replay ${this.replayId}`);
      const end = moment();
      let start = end.clone().subtract(this.config.interval + this.config.intervalOverlap);
      if (start.diff(this.startTime) < 0) {
         start = this.startTime.clone();
      }

      const delta = end.diff(start);
      if (delta < this.config.intervalOverlap) {
         logger.info(`   skipping metrics, not enough time has passed`);
      } else {
         logger.info(`   waiting ${this.config.metricsDelay} ms before gathering metrics`);
         this.metricsPromises.push(new Promise<void>((resolve, reject) => {
            setTimeout(async () => {
               logger.info(`   retrieving metrics from ${start.toDate()} to ${end.toDate()}`);
               try {
                  await this.sendMetricsToS3(start.toDate(), end.toDate());
               } catch (e) {
                  reject(`Failed to get metrics for replay ${this.replayId}`);
               }
               resolve();
            }, this.config.metricsDelay);
         }));
      }
   }

   public async prepareFinalMetricsFile() {
      const metricsStorage = new MetricsStorage(this.storage);
      await metricsStorage.read(this.replay, false);
   }

   protected processCommand = (capture: ICapture, command: ICommand) =>
         new Promise<void>((resolve, reject) => {

      // first, get the delta time until the command should be run
      let t: moment.Moment = moment(command.event_time);
      if (!this.config.mock) { t = t.subtract(7, 'hours'); }

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
      const cmdInfo = command ? command.argument.substr(0, 40).replace('\n', ' ') + '...' : 'connect';
      logger.info(`--- Replay ${this.replayId} is performing command "${cmdInfo}"`);
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

   protected async sendMetricsToS3(start: Date, end: Date) {
      const data: IMetricsList[] = [];
      for (const entry in MetricsHash) {
         const metricType = MetricsHash[entry];

         logger.info(`   * ${metricType.metricName}`);

         const metrics = await this.metrics!.getMetricsForType(metricType, start, end);
         const datapoints = metrics.dataPoints;

         if (metricType.metricType === MetricType.MEMORY) {
            datapoints.forEach((metric) => {
               metric.Unit = "Megabytes";
               metric.Maximum *= ByteToMegabyte;
            });
         }

         logger.info(`      * ${datapoints.length} datapoints`);
         data.push(metrics);
      }

      const key = schema.metrics.getSingleSampleKey({
         type: ChildProgramType.REPLAY,
         id: this.replay.id,
         envId: this.config.envId,
      }, end);
      logger.info(`      * saving metrics to ${key}`);
      await this.storage.writeJson(key, data);
      logger.info(`      * done!`);
   }

}
