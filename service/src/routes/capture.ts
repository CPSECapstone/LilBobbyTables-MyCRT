import { S3 } from 'aws-sdk';
import * as http from 'http-status-codes';

import { CaptureConfig, launch } from '@lbt-mycrt/capture';
import { ChildProgramStatus, ChildProgramType, ICapture, IChildProgram, IMetric,
         IMetricsList, Logging, MetricsStorage, MetricType } from '@lbt-mycrt/common';
import { LocalBackend } from '@lbt-mycrt/common/dist/storage/local-backend';
import { S3Backend } from '@lbt-mycrt/common/dist/storage/s3-backend';
import { getSandboxPath } from '@lbt-mycrt/common/dist/storage/sandbox';

import { captureDao } from '../dao/mycrt-dao';
import * as check from '../middleware/request-validation';
import * as schema from '../request-schema/capture-schema';
import { settings } from '../settings';
import SelfAwareRouter from './self-aware-router';

export default class CaptureRouter extends SelfAwareRouter {
   public name: string = 'capture';
   public urlPrefix: string = '/captures';

   protected mountRoutes(): void {
      const logger = Logging.defaultLogger(__dirname);

      this.router.get('/', this.handleHttpErrors(async (request, response) => {

         const captures = await captureDao.getAllCaptures();
         response.json(captures);

      }));

      this.router.get('/:id(\\d+)', check.validParams(schema.idParams),
            this.handleHttpErrors(async (request, response) => {

         const id = request.params.id;
         const capture = await captureDao.getCapture(id);
         response.json(capture);

      }));

      this.router.get('/:id(\\d+)/metrics', check.validParams(schema.idParams),
            check.validQuery(schema.metricTypeQuery), this.handleHttpErrors(async (request, response) => {

         const type: MetricType | undefined = request.query.type;

         // TODO: add configuration for choosing the backend
         // const storage: MetricsStorage = new MetricsStorage(new S3Backend(new S3(), 'lil-test-environment'));
         const storage = new MetricsStorage(new LocalBackend(getSandboxPath()));

         logger.info(`Getting ${type} metrics for capture ${request.params.id}`);
         const capture = await captureDao.getCapture(request.params.id);
         const result = await storage.readMetrics(capture!, type);
         response.json(result);

      }));

      this.router.post('/:id(\\d+)/stop', check.validParams(schema.idParams),
            this.handleHttpErrors(async (request, response) => {

         const captureId = request.params.id;
         await this.ipcNode.stopCapture(captureId);
         logger.info(`Capture ${captureId} stopped`);
         response.status(http.OK).end();

      }));

      this.router.post('/', check.validBody(schema.captureBody), this.handleHttpErrors(async (request, response) => {

         const captureTemplate: ICapture = {
            type: ChildProgramType.CAPTURE,
            status: ChildProgramStatus.STARTED, // no scheduled captures yet
            name: request.body.name,
         };

         const capture = await captureDao.makeCapture(captureTemplate);

         logger.info(`Launching capture with id ${capture!.id!}`);
         const config = new CaptureConfig(capture!.id!);
         config.mock = settings.captures.mock;
         config.interval = settings.captures.interval;
         config.intervalOverlap = settings.captures.intervalOverlap;

         launch(config);
         response.json(capture).end();
         logger.info(`Successfully created capture!`);

      }));

   }
}
