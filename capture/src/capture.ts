import mysql = require('mysql');
import { setTimeout } from 'timers';

import { CaptureIpcNode, ICaptureIpcNodeDelegate, IpcNode, Logging, Metric,
   MetricsBackend, MetricsHash, MetricType, utils } from '@lbt-mycrt/common';
import { Subprocess } from '@lbt-mycrt/common/dist/capture-replay/subprocess';
import { ByteToMegabyte, ChildProgramStatus, ChildProgramType, IChildProgram, IEnvironment,
   IEnvironmentFull } from '@lbt-mycrt/common/dist/data';
import { MetricsStorage } from '@lbt-mycrt/common/dist/metrics/metrics-storage';
import { StorageBackend } from '@lbt-mycrt/common/dist/storage/backend';
import { path as schema } from '@lbt-mycrt/common/dist/storage/backend-schema';

import { CaptureConfig } from './args';
import { captureDao } from './dao';
import { fakeRequest } from './workload/local-workload-logger';
import { prepareWorkload } from './workload/replay-prep';
import { WorkloadLogger } from './workload/workload-logger';
import { WorkloadStorage } from './workload/workload-storage';

const logger = Logging.defaultLogger(__dirname);

export class Capture extends Subprocess implements ICaptureIpcNodeDelegate {

   public env: IEnvironmentFull;

   private ipcNode: IpcNode;

   constructor(public config: CaptureConfig, private workloadLogger: WorkloadLogger, storage: StorageBackend,
         metrics: MetricsBackend, env: IEnvironmentFull) {
      super(storage, metrics);
      this.ipcNode = new CaptureIpcNode(this.id, logger, this);
      this.env = env;
   }

   get id(): number {
      return this.config.id;
   }

   get nameId(): string {
      return `capture ${this.id}`;
   }

   get interval(): number {
      return this.config.interval;
   }

   public async onStop(): Promise<any> {
      logger.info(`Capture ${this.id} received stop signal!`);
      this.stop(true);

      logger.info("set status to 'stopping'");
      await captureDao.updateCaptureStatus(this.id, ChildProgramStatus.STOPPING);

      logger.info("record end time");
      await captureDao.updateCaptureEndTime(this.id);

   }

   public asIChildProgram(): IChildProgram {
      return {
         id: this.id,
         type: ChildProgramType.CAPTURE,
         status: this.status,
         start: this.startTime || undefined,
         envId: this.env.id,
      };
   }

   protected async setup(): Promise<void> {
      try {
         logger.info(`Performing setup for Capture ${this.id}`);

         logger.info(`Start ipc node`);
         await this.ipcNode.start();

         logger.info(`Setting Capture ${this.id} status to 'starting'`);
         await captureDao.updateCaptureStatus(this.id, ChildProgramStatus.STARTING);

         logger.info(`Starting RDS logging`);
         await this.workloadLogger.setLogging(true);

         logger.info(`Setting Capture ${this.id} status to 'live'`);
         await captureDao.updateCaptureStatus(this.id, ChildProgramStatus.RUNNING);

         this.startTime = new Date();
         logger.info(`Setting Capture ${this.id} startTime = ${this.startTime!.toJSON()}`);
         await captureDao.updateCaptureStartTime(this.id);

         logger.info(`Setup for Capture ${this.id} complete!`);
      } catch (error) {
         this.selfDestruct(`Failed to setup capture ${error}`);
      }
   }

   protected async loop(): Promise<void> {
      logger.info('-----------==[ LOOP ]==-----------');

      const end = new Date();
      const start = new Date(end.getTime() - this.interval - this.config.intervalOverlap);
      if (start.getTime() < this.startTime!.getTime()) {
         start.setTime(this.startTime!.getTime());
      }

      logger.info(`startTime = ${start}`);
      logger.info(`endTime   = ${end}`);

      logger.info('-< Process Workload >-------------');
      await this.sendWorkloadToS3(start, end);

      if (this.config.mock) {
         logger.info('-< generate fake traffic for the mock workload >-------');
         await fakeRequest();
      }

      // We want to wait a bit to gather metrics for this interval.
      // It takes some time for Cloudwatch to be able to provide
      // the metrics we need.
      logger.info('-< Process Metrics >--------------');
      const metricsDelay = this.config.metricsDelay;
      logger.info(`   * waiting ${metricsDelay}ms before gathering metrics`);
      await utils.syncTimeout(async () => {
         await this.sendMetricsToS3(start, end);
      }, metricsDelay);
      logger.info(`   * metrics sent`);

   }

   protected async teardown(): Promise<void> {
      try {
         logger.info(`Performing teardown for Capture ${this.id}`);

         logger.info("turning off RDS logging");
         await this.workloadLogger.setLogging(false);

         logger.info(`Waiting for files to be prepared`);
         setTimeout(async () => {
            logger.info("building final workload file");
            const workloadStorage = new WorkloadStorage(this.storage);
            await workloadStorage.buildFinalWorkloadFile(this.asIChildProgram());

            logger.info("building final metrics file");
            const metricsStorage = new MetricsStorage(this.storage);
            await metricsStorage.read(this.asIChildProgram(), false);

            logger.info('Stopping ipc node');
            await this.ipcNode.stop();

            logger.info("Setting status to 'done'");
            await captureDao.updateCaptureStatus(this.id, ChildProgramStatus.DONE);

            logger.info(`Teardown for Capture ${this.id} complete!`);
         }, this.config.filePrepDelay);

      } catch (error) {
         this.selfDestruct(`teardown failed: ${error}`);
      }
   }

   protected async dontPanic(reason: string): Promise<void> {
      return captureDao.updateCaptureStatus(this.id, ChildProgramStatus.FAILED, reason);
   }

   private async sendWorkloadToS3(start: Date, end: Date) {
      await this.tryTwice(async () => {

         // download the fragment
         const fragment = await this.workloadLogger.getWorkloadFragment(start, end);
         logger.info(`Got ${fragment.commands.length} commands from ${fragment.start} to`
            + ` ${fragment.end}`);

         // clean up the fragment and prepare it for replay use
         logger.info(`Preparing fragment for replay`);
         prepareWorkload(fragment, this.config.mock);

         // upload the fragment to S3
         const key = schema.workload.getSingleSampleKey(this.asIChildProgram(), end);
         logger.info(`Saving workload fragment to ${key}`);
         await this.storage.writeJson(key, fragment);

      }, "Send workload fragment to S3");
   }

   private async sendMetricsToS3(start: Date, end: Date) {

      await this.tryTwice(async () => {

         const data = [];

         for (const entry in MetricsHash) {
            const metricType = MetricsHash[entry];

            logger.info(`   * ${metricType.metricName}...`);

            const metrics = await this.metrics.getMetricsForType(metricType, start, end);
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

         const key = schema.metrics.getSingleSampleKey(this.asIChildProgram(), end);
         logger.info(`   * saving metrics to ${key}`);
         await this.storage.writeJson(key, data);
         logger.info(`   * done!`);

      }, "send metrics to S3");
   }

}
