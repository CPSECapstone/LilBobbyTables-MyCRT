import { S3 } from 'aws-sdk';

import * as http from 'http-status-codes';

import { CaptureConfig, launch } from '@lbt-mycrt/capture';
import { ChildProgramStatus, ChildProgramType, ICapture, IChildProgram, IMetric,
         IMetricsList, Logging, MetricsStorage, MetricType } from '@lbt-mycrt/common';
import { LocalBackend } from '@lbt-mycrt/common/dist/storage/local-backend';
import { S3Backend } from '@lbt-mycrt/common/dist/storage/s3-backend';
import { getSandboxPath } from '@lbt-mycrt/common/dist/storage/sandbox';

import { getMetrics } from '../common/capture-replay-metrics';
import { captureDao, environmentDao, replayDao } from '../dao/mycrt-dao';
import { HttpError } from '../http-error';
import * as check from '../middleware/request-validation';
import * as schema from '../request-schema/capture-schema';
import { settings } from '../settings';
import SelfAwareRouter from './self-aware-router';

export default class CaptureRouter extends SelfAwareRouter {
   public name: string = 'capture';
   public urlPrefix: string = '/captures';

   protected mountRoutes(): void {
      const logger = Logging.defaultLogger(__dirname);

      this.router.get('/', check.validQuery(schema.envQuery),
            this.handleHttpErrors(async (request, response) => {

         const envId = request.query.envId;
         let captures;
         if (envId) {
            captures = await captureDao.getCapturesForEnvironment(envId);

         } else {
            captures = await captureDao.getAllCaptures();
         }

         response.json(captures);
      }));

      this.router.get('/:id(\\d+)', check.validParams(schema.idParams),
            this.handleHttpErrors(async (request, response) => {

         const id = request.params.id;
         const capture = await captureDao.getCapture(id);
         if (!capture) {
            throw new HttpError(http.NOT_FOUND);
         }
         response.json(capture);

      }));

      this.router.get('/:id(\\d+)/metrics', check.validParams(schema.idParams),
            check.validQuery(schema.metricTypeQuery), this.handleHttpErrors(async (request, response) => {

         const type: MetricType | undefined = request.query.type;
         const capture = await captureDao.getCapture(request.params.id);

         const result = await getMetrics(capture, type);
         response.json(result);

      }));

      this.router.post('/:id(\\d+)/stop', check.validParams(schema.idParams),
            this.handleHttpErrors(async (request, response) => {

         const capture = await captureDao.getCapture(request.params.id);
         if (!capture) {
            throw new HttpError(http.NOT_FOUND);
         }

         switch (capture.status) {

            case ChildProgramStatus.RUNNING:
               await this.ipcNode.stopCapture(capture.id!);
               logger.info(`Capture ${capture.id!} stopped`);
               response.status(http.OK).end();
               return;

            case ChildProgramStatus.SCHEDULED:
               // TODO: unschedule the capture
               throw new HttpError(http.NOT_IMPLEMENTED,
                  "No support for stopping scheduled captures that haven't started");

            case ChildProgramStatus.STARTING:
            case ChildProgramStatus.STARTED:
               throw new HttpError(http.CONFLICT, "Cannot stop the capture until it has started completely. "
                  + "Try again soon.");
            case ChildProgramStatus.STOPPING:
            case ChildProgramStatus.DONE:
               throw new HttpError(http.CONFLICT, "This capture has already been stopped.");
            case ChildProgramStatus.FAILED:
               throw new HttpError(http.CONFLICT, "This capture failed and is no longer running.");
         }

      }));

      this.router.post('/', check.validBody(schema.captureBody), this.handleHttpErrors(async (request, response) => {

         const env = await environmentDao.getEnvironment(request.body.envId);
         if (!env) {
            throw new HttpError(http.BAD_REQUEST, `Environment ${request.body.envId} does not exist`);
         }

         const captureTemplate: ICapture = {
            type: ChildProgramType.CAPTURE,
            status: ChildProgramStatus.STARTED, // no scheduled captures yet
            name: request.body.name,
            envId: request.body.envId,
         };

         const capture = await captureDao.makeCapture(captureTemplate);

         logger.info(`Launching capture with id ${capture!.id!}`);
         const config = new CaptureConfig(capture!.id!, request.body.envId);
         config.mock = settings.captures.mock;
         config.interval = settings.captures.interval;
         config.intervalOverlap = settings.captures.intervalOverlap;

         launch(config);
         response.json(capture).end();
         logger.info(`Successfully created capture!`);

      }));

      this.router.delete('/:id(\\d+)', check.validParams(schema.idParams),
            check.validQuery(schema.deleteLogsQuery),
            this.handleHttpErrors(async (request, response) => {

         const id = request.params.id;
         const deleteLogs: boolean | undefined = request.query.deleteLogs;
         const captureRow = await captureDao.getCapture(id);

         if (deleteLogs === true && captureRow && captureRow.envId) {
            const env = await environmentDao.getEnvironmentFull(captureRow.envId);

            if (env) {
               /* TODO: make sure key matches the key in rds-logging.ts uploadToS3 */
               const key = "capture" + id + "/workload.json";

               /* TODO: Replace with S3StorageBackend object in the Capture Object */
               const storage = new S3Backend(
                     new S3({region: env.region,
                        accessKeyId: env.accessKey,
                        secretAccessKey: env.secretKey}),
                     env.bucket,
                  );

               if (await storage.exists(key)) {
                  await storage.deleteJson(key);
               }
            }
         }

         const capture = await captureDao.deleteCapture(id);
         if (!capture) {
            throw new HttpError(http.NOT_FOUND);
         }
         response.json(capture);

      }));

   }
}
