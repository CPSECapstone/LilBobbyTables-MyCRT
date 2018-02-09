import { S3 } from 'aws-sdk';
import * as http from 'http-status-codes';

import { CaptureConfig, launch } from '@lbt-mycrt/capture';
import { ChildProgramStatus, ChildProgramType, ICapture, IChildProgram, IMetric,
         IMetricsList, Logging, MetricsStorage, MetricType } from '@lbt-mycrt/common';
import { LocalBackend } from '@lbt-mycrt/common/dist/storage/local-backend';
import { S3Backend } from '@lbt-mycrt/common/dist/storage/s3-backend';
import { getSandboxPath } from '@lbt-mycrt/common/dist/storage/sandbox';

import { captureDao } from '../dao/mycrt-dao';
import { settings } from '../settings';
import SelfAwareRouter from './self-aware-router';

export default class CaptureRouter extends SelfAwareRouter {
   public name: string = 'capture';
   public urlPrefix: string = '/captures';

   protected mountRoutes(): void {
      const logger = Logging.defaultLogger(__dirname);

      this.router.get('/', async (request, response) => {
         try {
            const captures = await captureDao.getAllCaptures();
            response.json(captures);
         } catch (error) {
            // TODO: send error message
            logger.error(error);
            response.status(http.INTERNAL_SERVER_ERROR).end();
         }
      });

      this.router.get('/:id', async (request, response) => {
         const id = request.params.id;
         try {
            const capture = await captureDao.getCapture(id);
            response.json(capture);
         } catch (error) {
            // TODO: send error message
            logger.error(error);
            response.status(http.INTERNAL_SERVER_ERROR).end();
         }
      });

      this.router.get('/:id/metrics', async (request, response) => {

         try {
            const typeQuery = request.query.type;
            const type: MetricType | undefined = typeQuery && typeQuery.toString().toUpperCase() as MetricType;

            // TODO: add configuration for choosing the backend
            // const storage: MetricsStorage = new MetricsStorage(new S3Backend(new S3(), 'lil-test-environment'));
            const storage = new MetricsStorage(new LocalBackend(getSandboxPath()));

            logger.info(`Getting ${type} metrics for capture ${request.params.id}`);
            const capture = await captureDao.getCapture(request.params.id);
            const result = await storage.readMetrics(capture, type);
            response.json(result);

         } catch (error) {
            // TODO: send error message
            logger.error(error);
            response.status(http.INTERNAL_SERVER_ERROR).end();
         }

      });

      this.router.post('/:id/stop', async (request, response) => {

         try {
            const captureId = request.params.id;
            await this.ipcNode.stopCapture(captureId);
            logger.info(`Capture ${captureId} stopped`);
            response.status(http.OK).end();
         } catch (error) {
            // TODO: send error message
            logger.error(error);
            response.status(http.INTERNAL_SERVER_ERROR).end();
         }

      });

      this.router.post('/', async (request, response) => {

         const captureTemplate: ICapture = {
            type: ChildProgramType.CAPTURE,
            status: ChildProgramStatus.STARTED, // no scheduled captures yet
            name: request.body.name,
         };

         try {
            const capture = await captureDao.makeCapture(captureTemplate);

            logger.info(`Launching capture with id ${capture.id!}`);
            const config = new CaptureConfig(capture.id!);
            config.mock = settings.captures.mock;
            config.interval = settings.captures.interval;
            config.intervalOverlap = settings.captures.intervalOverlap;

            launch(config);

            logger.info(`Successfully created capture!`);
            response.json(capture).end();

         } catch (error) {
            // TODO: send error message
            logger.error(error);
            response.status(http.INTERNAL_SERVER_ERROR).end();
         }

      });

   }
}
