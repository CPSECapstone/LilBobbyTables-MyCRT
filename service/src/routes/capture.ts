import { S3 } from 'aws-sdk';
import * as http from 'http-status-codes';
import schedule = require('node-schedule');

import { ChildProgramStatus, ChildProgramType, ICapture, IChildProgram, IMetric, IMetricsList,
   Logging, MetricType, ServerIpcNode} from '@lbt-mycrt/common';
import { LocalBackend } from '@lbt-mycrt/common/dist/storage/local-backend';
import { S3Backend } from '@lbt-mycrt/common/dist/storage/s3-backend';
import { getSandboxPath } from '@lbt-mycrt/common/dist/storage/sandbox';
import { Template } from '@lbt-mycrt/gui/dist/main';

import * as session from '../auth/session';
import { getMetrics } from '../common/capture-replay-metrics';
import { startCapture } from '../common/launching';
import { captureDao, environmentDao, replayDao } from '../dao/mycrt-dao';
import { HttpError } from '../http-error';
import * as check from '../middleware/request-validation';
import * as schema from '../request-schema/capture-schema';
import SelfAwareRouter from './self-aware-router';

export default class CaptureRouter extends SelfAwareRouter {
   public name: string = 'capture';
   public urlPrefix: string = '/captures';

   constructor(ipcNode: ServerIpcNode) {
      super(ipcNode, [
         session.loggedInOrForbidden,
      ]);
   }

   protected mountRoutes(): void {
      const logger = Logging.defaultLogger(__dirname);

      this.router.get('/', check.validQuery(schema.envQuery),
            this.handleHttpErrors(async (request, response) => {

         const envId = request.query.envId;
         const name = request.query.name;
         let captures;
         if (envId) {
            captures = await captureDao.getCapturesForEnvironment(envId);
            if (name) {
               captures = await captureDao.getCapturesForEnvByName(envId, name);
            }
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
         if (capture === null) {
            throw new HttpError(http.NOT_FOUND);
         } else if (!capture.envId) {
            throw new HttpError(http.CONFLICT, `Capture ${capture.id} has no envId`);
         }

         const environment = await environmentDao.getEnvironmentFull(capture.envId);
         if (environment === null) {
            throw new HttpError(http.CONFLICT, `Capture ${capture.id}'s environment does not exist`);
         }

         const result = await getMetrics(capture, environment, type);
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
               const stopResult = await this.ipcNode.stopCapture(capture.id!);
               logger.info(`Got stopResult: ${JSON.stringify(stopResult)}`);
               if (stopResult === null) {
                  captureDao.updateCaptureStatus(capture.id!, ChildProgramStatus.FAILED);
                  throw new HttpError(http.INTERNAL_SERVER_ERROR, "Failed to send the capture stop signal");
               } else {
                  logger.info(`Capture ${capture.id!} stopped`);
                  response.status(http.OK).end();
               }
               return;

            case ChildProgramStatus.SCHEDULED:
               // TODO: unschedule the capture)
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

      this.router.post('/',
         check.validBody(schema.captureBody),
         this.handleHttpErrors(async (request, response) => {

            const initialStatus: string | undefined = request.body.status;
            let inputTime: Date = request.body.scheduledStart;  // retrieve scheduled time
            let endTime: Date | undefined;

            const capWithSameName = await captureDao.getCapturesForEnvByName(request.body.envId, request.body.name);
            if (capWithSameName !== null) {
               throw new HttpError(http.BAD_REQUEST, "Capture with same name already exists in this environment");
            }

            if (!inputTime) {
               inputTime = new Date();
            }

            const duration = request.body.duration;

            if (duration && duration < 60) {
               throw new HttpError(http.BAD_REQUEST, `Duration must be at least 60 seconds`);
            }

            if (duration) {
               endTime = this.createEndDate(inputTime, duration);
            }

            const env = await environmentDao.getEnvironment(request.body.envId);
            if (!env) {
               throw new HttpError(http.BAD_REQUEST, `Environment ${request.body.envId} does not exist`);
            }

            if (initialStatus === ChildProgramStatus.SCHEDULED && !request.body.scheduledStart) {
               throw new HttpError(http.BAD_REQUEST, `Cannot schedule without a start schedule time`);
            }

            // throw new HttpError(http.NOT_IMPLEMENTED, "Cameron, you need to test this!");
            let captureTemplate: ICapture | null = {
               type: ChildProgramType.CAPTURE,
               ownerId: request.user!.id,
               envId: env.id,
               status: initialStatus === ChildProgramStatus.SCHEDULED ?
                  ChildProgramStatus.SCHEDULED : ChildProgramStatus.STARTED,
               name: request.body.name,
               scheduledEnd: endTime,
            };

            // if status is scheduled, start at a scheduled time
            if (initialStatus === ChildProgramStatus.SCHEDULED) {
               captureTemplate.scheduledStart = inputTime;
            }

            // assign capture, insert into db
            captureTemplate = await captureDao.makeCapture(captureTemplate);

            if (captureTemplate === null) {
               throw new HttpError(http.INTERNAL_SERVER_ERROR, `error creating capture in db`);
            }

            response.json(captureTemplate);

            if (initialStatus === ChildProgramStatus.SCHEDULED) {
               schedule.scheduleJob(inputTime, () => { startCapture(captureTemplate!); });
            } else {
               startCapture(captureTemplate);
            }

            logger.info(`Successfully created capture!`);

            if (duration) {
               schedule.scheduleJob(endTime!, () => { this.stopScheduledCapture(captureTemplate!); }); // scheduled stop
            }
         },
      ));

      this.router.delete('/:id(\\d+)', check.validParams(schema.idParams),
            check.validQuery(schema.deleteLogsQuery),
            this.handleHttpErrors(async (request, response) => {

         const id = request.params.id;
         const deleteLogs: boolean | undefined = request.query.deleteLogs;
         const captureRow = await captureDao.getCapture(id);

         const capture = await captureDao.deleteCapture(id);
         if (!capture) {
            throw new HttpError(http.NOT_FOUND);
         }

         if (deleteLogs === true && captureRow && captureRow.envId) {
            const env = await environmentDao.getEnvironmentFull(captureRow.envId);

            if (env) {
               /* TODO: Replace with S3StorageBackend object in the Capture Object */
               const storage = new S3Backend(
                     new S3({region: env.region,
                        accessKeyId: env.accessKey,
                        secretAccessKey: env.secretKey}),
                     env.bucket, env.prefix,
                  );

               const key = "capture" + id + "/";
               await storage.deletePrefix(key);
            }
         }

         response.json(capture);

      }));
   }

   private createEndDate(startTime: Date, seconds: number): Date {
      const endTime = new Date(startTime.getTime());
      endTime.setSeconds(startTime.getSeconds() + seconds);
      return endTime;
   }

   private async stopScheduledCapture(capture: ICapture): Promise<void> {
      const logger = Logging.defaultLogger(__dirname);

      // TODO: Query database to check if capture is running,
      //       if yes, send "await this.ipcNode.stopCapture(capture.id!);"
      await this.ipcNode.stopCapture(capture.id!);
      logger.info(`Capture ${capture.id!} stopped`);
   }
}
