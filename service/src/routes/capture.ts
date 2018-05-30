import { S3 } from 'aws-sdk';
import * as http from 'http-status-codes';
import schedule = require('node-schedule');

import { ChildProgramStatus, ChildProgramType, ICapture, IChildProgram, IDbReference, IMetric,
   IMetricsList, IMimic, IReplay, IReplayFull, Logging, MetricType, ServerIpcNode, SlackBot} from '@lbt-mycrt/common';
import { LocalBackend } from '@lbt-mycrt/common/dist/storage/local-backend';
import { S3Backend } from '@lbt-mycrt/common/dist/storage/s3-backend';
import { getSandboxPath } from '@lbt-mycrt/common/dist/storage/sandbox';
import { Template } from '@lbt-mycrt/gui/dist/main';

import { makeSureUserIsEnvironmentMember } from '../auth/middleware';
import * as session from '../auth/session';
import { getMetrics } from '../common/capture-replay-metrics';
import { startCapture, startMimic } from '../common/launching';
import { captureDao, environmentDao, environmentInviteDao as inviteDao, replayDao } from '../dao/mycrt-dao';
import { HttpError } from '../http-error';
import { noMimicReplaysOnSameDb } from '../middleware/replay';
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

         const capture = await captureDao.getCapture(request.params.id);

         if (!capture) {
            throw new HttpError(http.NOT_FOUND);
         }

         const environment = await environmentDao.getEnvironment(capture!.envId!);
         if (!environment) {
            throw new HttpError(http.NOT_FOUND, `Capture ${request.params.id}'s environment does not exist`);
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

         const capture = await captureDao.getCapture(request.params.id);

         if (!capture) {
            throw new HttpError(http.NOT_FOUND);
         }

         const environment = await environmentDao.getEnvironmentFull(capture!.envId!);
         if (environment === null) {
            throw new HttpError(http.NOT_FOUND, `Capture ${request.params.id}'s environment does not exist`);
         }

         const isUserMember = await inviteDao.getUserMembership(request.user!, environment!);
         if (isUserMember.isMember) {
            const result = await getMetrics(capture, environment!, request.query.type);
            response.json(result);
         } else {
            throw new HttpError(http.UNAUTHORIZED);
         }
      }));

      this.router.post('/:id(\\d+)/stop', check.validParams(schema.idParams),
            this.handleHttpErrors(async (request, response) => {

         const capture = await captureDao.getCapture(request.params.id);
         if (!capture) {
            throw new HttpError(http.NOT_FOUND);
         }

         const environment = await environmentDao.getEnvironment(capture!.envId!);
         if (!environment) {
            throw new HttpError(http.NOT_FOUND, `Capture ${request.params.id}'s environment does not exist`);
         }

         const isUserMember = await inviteDao.getUserMembership(request.user!, environment!);
         if (request.user! !== capture!.ownerId && !isUserMember.isAdmin) {
            throw new HttpError(http.UNAUTHORIZED);
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
         if (!capture) {
            throw new HttpError(http.NOT_FOUND);
         }

         const environment = await environmentDao.getEnvironment(capture!.envId!);
         if (!environment) {
            throw new HttpError(http.NOT_FOUND, `Capture ${request.params.id}'s environment does not exist`);
         }

         const isUserMember = await inviteDao.getUserMembership(request.user!, environment!);
         if (request.user! !== capture!.ownerId && !isUserMember.isAdmin) {
            throw new HttpError(http.UNAUTHORIZED);
         }

         const capWithSameName = await captureDao.getCapturesForEnvByName(request.params.id, request.body.name);
         if (capWithSameName !== null) {
            throw new HttpError(http.BAD_REQUEST, "Capture with same name already exists in this environment");
         }

         const updateCapture = await captureDao.updateCaptureName(capture.id!, request.body.name);
         response.status(http.OK).end();
      }));

      this.router.post('/mimic',
         check.validBody(schema.mimicBody),
         this.handleHttpErrors(makeSureUserIsEnvironmentMember((req) => req.body.envId)),
         this.handleHttpErrors(noMimicReplaysOnSameDb),
         this.handleHttpErrors(async (request, response) => {

            const environment = await environmentDao.getEnvironment(request.body.envId);
            if (!environment) {
               throw new HttpError(http.NOT_FOUND, `Environment ${request.body.envId} does not exist`);
            }

            let endTime: Date | undefined;
            if (request.body.duration) {
               endTime = this.createEndDate(request.body.scheduledStart || new Date(),
                  request.body.duration);
            }

            // make the capture
            let capture: ICapture | null = {
               type: ChildProgramType.CAPTURE,
               ownerId: request.user!.id,
               envId: environment.id,
               status: request.body.scheduledStart ? ChildProgramStatus.SCHEDULED : ChildProgramStatus.STARTED,
               scheduledStart: request.body.scheduledStart ? request.body.scheduledStart : undefined,
               name: request.body.name,
               scheduledEnd: endTime,
            };
            capture = await captureDao.makeCapture(capture);
            if (capture === null) {
               throw new HttpError(http.INTERNAL_SERVER_ERROR, "Failed to create capture in DB");
            }

            // make all of the replays
            const replays: IReplay[] = [];
            for (const replay of (request.body.replays as IReplayFull[])) {

               let db: IDbReference | null = {
                  name: replay.dbName,
                  host: replay.host,
                  user: replay.user,
                  pass: replay.pass,
                  instance: replay.instance,
                  parameterGroup: replay.parameterGroup,
               };
               db = await environmentDao.makeDbReference(db);
               if (!db) {
                  throw new HttpError(http.INTERNAL_SERVER_ERROR, "DB reference could not be created");
               }

               let replayTemplate: IReplay | null = {
                  type: ChildProgramType.REPLAY,
                  name: replay.name,
                  captureId: capture!.id,
                  status: ChildProgramStatus.STARTED,
                  dbId: db!.id,
                  ownerId: request.user!.id,
                  scheduledEnd: endTime,
               };
               replayTemplate = await replayDao.makeReplay(replayTemplate);
               if (!replayTemplate) {
                  throw new HttpError(http.INTERNAL_SERVER_ERROR, "Failed to create replay in the DB");
               }

               replays.push(replayTemplate);
            }

            // make the mimic
            const mimic: IMimic = {
               ...capture,
               type: ChildProgramType.MIMIC,
               replays,
            };

            // Start it
            if (request.body.scheduledStart) {
               schedule.scheduleJob(request.body.scheduledStart, () => {
                  startMimic(mimic);
                  SlackBot.postMessage("Oi bobby here, the clock struck " + capture!.scheduledStart! +
                     " so I started your mimicked capture and replays for `" + capture!.name + "`", environment.id!);
               });
            } else {
               startMimic(mimic);
            }

            // End it
            if (request.body.duration) {
               schedule.scheduleJob(endTime!, () => {
                  this.stopScheduledCapture(capture!);
                  SlackBot.postMessage("Swiggety swag :party-parrot: your mimicked captures and replays for `" +
                     capture!.name + "` are complete. How cool was that?!", environment.id!);
               });
            }

            response.json(mimic);
         }),
      );

      this.router.post('/', check.validBody(schema.captureBody),
            this.handleHttpErrors(async (request, response) => {

         const initialStatus: string | undefined = request.body.status;
         let inputTime: Date = request.body.scheduledStart;  // retrieve scheduled time
         let endTime: Date | undefined;

         const environment = await environmentDao.getEnvironment(request.body.envId);
         if (!environment) {
            throw new HttpError(http.NOT_FOUND, `Environment ${request.body.envId} does not exist`);
         }

         const isUserMember = await inviteDao.getUserMembership(request.user!, environment!);
         if (!isUserMember.isMember) {
            throw new HttpError(http.UNAUTHORIZED);
         }

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

         if (initialStatus === ChildProgramStatus.SCHEDULED && !request.body.scheduledStart) {
            throw new HttpError(http.BAD_REQUEST, `Cannot schedule without a start schedule time`);
         }

         // throw new HttpError(http.NOT_IMPLEMENTED, "Cameron, you need to test this!");
         let captureTemplate: ICapture | null = {
            type: ChildProgramType.CAPTURE,
            ownerId: request.user!.id,
            envId: environment.id,
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
            schedule.scheduleJob(inputTime, () => {
               startCapture(captureTemplate!);
               SlackBot.postMessage("It's time to start your scheduled capture *" +
                  captureTemplate!.name + "* and I'm on it!", environment.id!);
            });
         } else {
            startCapture(captureTemplate);
         }

         logger.info(`Successfully created capture!`);

         if (duration) {
            schedule.scheduleJob(endTime!, () => {
               this.stopScheduledCapture(captureTemplate!);
               SlackBot.postMessage("Time's up! I just stopped your scheduled capture *" +
                  captureTemplate!.name + "* :party-parrot:", environment.id!);
            });
         }
      },
   ));

      this.router.delete('/:id(\\d+)', check.validParams(schema.idParams),
            check.validQuery(schema.deleteLogsQuery),
            this.handleHttpErrors(async (request, response) => {

         const isDeleteLogs: boolean | undefined = request.query.deleteLogs;

         const capture = await captureDao.getCapture(request.params.id);
         if (!capture) {
            throw new HttpError(http.NOT_FOUND);
         }

         const environment = await environmentDao.getEnvironment(capture!.envId!);
         if (!environment) {
            throw new HttpError(http.NOT_FOUND, `Capture ${request.params.id}'s environment does not exist`);
         }

         const isUserMember = await inviteDao.getUserMembership(request.user!, environment!);
         if (request.user! !== capture!.ownerId && !isUserMember.isAdmin) {
            throw new HttpError(http.UNAUTHORIZED);
         }

         const captureDel = await captureDao.deleteCapture(request.params.id);

         if (isDeleteLogs === true && capture && capture.envId) {
            const env = await environmentDao.getEnvironmentFull(capture.envId);

            if (env) {
               /* TODO: Replace with S3StorageBackend object in the Capture Object */
               const storage = new S3Backend(
                  new S3({
                        region: env.region,
                        accessKeyId: env.accessKey,
                        secretAccessKey: env.secretKey,
                     }),
                  env.bucket, env.prefix,
               );

               const capturePrefix = `environment${env.id}/capture${request.params.id}/`;
               await storage.deletePrefix(capturePrefix);
            }
         }
         response.status(http.OK).end();
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
