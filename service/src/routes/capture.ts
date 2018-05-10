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
import { captureDao, environmentDao, environmentInviteDao as inviteDao, replayDao } from '../dao/mycrt-dao';
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

      this.router.get('/', check.validQuery(schema.capQuery),
            this.handleHttpErrors(async (request, response) => {

         const envId = request.query.envId;
         const name = request.query.name;
         let captures;
         if (envId) {
            const environment = await environmentDao.getEnvironment(envId);
            if (!environment) {
               throw new HttpError(http.NOT_FOUND, `Environment ${envId} does not exist`);
            }

            const isUserMember = await inviteDao.getUserMembership(request.user!, environment!);
            if (isUserMember.isMember) {
               if (name) {
                  captures = await captureDao.getCapturesForEnvByName(envId, name);
               } else {
                  captures = await captureDao.getCapturesForEnvironment(envId);
               }
            } else {
               throw new HttpError(http.UNAUTHORIZED);
            }
         } else {
            captures = await captureDao.getAllCaptures(request.user!);
         }
         response.json(captures);
      }));

      this.router.get('/:id(\\d+)', check.validParams(schema.idParams),
            this.handleHttpErrors(async (request, response) => {

         const id = request.params.id;
         const capture = await captureDao.getCapture(id);
         const environment = await environmentDao.getEnvironment(id);

         if (!capture || !environment) {
            throw new HttpError(http.NOT_FOUND);
         }
         const isUserMember = await inviteDao.getUserMembership(request.user!, environment!);
         if (isUserMember.isMember) {
            response.json(capture);
         } else {
            throw new HttpError(http.UNAUTHORIZED);
         }

      }));

      this.router.get('/:id(\\d+)/metrics', check.validParams(schema.idParams),
            check.validQuery(schema.metricTypeQuery), this.handleHttpErrors(async (request, response) => {

         const type: MetricType | undefined = request.query.type;
         const capture = await captureDao.getCapture(request.params.id);
         // check that user owns the capture or belongs to the environment
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
         // check that user owns the capture or belongs to the environment
         if (!capture) {
            throw new HttpError(http.NOT_FOUND);
         }

         switch (capture.status) {

            case ChildProgramStatus.RUNNING:
               const stopResult = await this.ipcNode.stopCapture(capture.id!);
               logger.info(`Got stopResult: ${JSON.stringify(stopResult)}`);
               if (stopResult === null) {
                  const reason = "Failed to send the capture stop signal";
                  captureDao.updateCaptureStatus(capture.id!, ChildProgramStatus.FAILED, reason);
                  throw new HttpError(http.INTERNAL_SERVER_ERROR, reason);
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

      this.router.put('/:id(\\d+)', check.validParams(schema.idParams), check.validBody(schema.putCaptureBody),
            this.handleHttpErrors(async (request, response) => {

         const capture = await captureDao.getCapture(request.params.id);
         // check that the user owns the capture or user owns the environment
         if (!capture || !capture!.envId) {
            throw new HttpError(http.NOT_FOUND);
         }

         const captures = await captureDao.getCapturesForEnvironment(capture!.envId!);
         if (!captures) {
            throw new HttpError(http.INTERNAL_SERVER_ERROR);
         }

         let nameAvailable = true;

         captures.forEach( (value, index, arr) => {
            if (value.name && value.name! === request.body.name) {
               nameAvailable = false;
            }
         });

         if (nameAvailable) {
            await captureDao.updateCaptureName(capture.id!, request.body.name);
            response.status(http.OK).end();
         } else {
            throw new HttpError(http.CONFLICT, "A capture with this name already exists.");
         }

      }));

      this.router.post('/', check.validBody(schema.captureBody),
            this.handleHttpErrors(async (request, response) => {

         const initialStatus: string | undefined = request.body.status;
         let inputTime: Date = request.body.scheduledStart;  // retrieve scheduled time
         let endTime: Date | undefined;

         // check that user owns the capture or belongs to the environment
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

         if (initialStatus === ChildProgramStatus.SCHEDULED) {
            captureTemplate.scheduledStart = inputTime;
         }

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

         // check that user owns the capture or owns the environment
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

               const capturePrefix = `environment${env.id}/capture${id}/`;
               await storage.deletePrefix(capturePrefix);
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
