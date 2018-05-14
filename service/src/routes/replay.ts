import { S3 } from 'aws-sdk';
import * as http from 'http-status-codes';
import schedule = require('node-schedule');

import { ChildProgramStatus, ChildProgramType, IDbReference, IReplay,
      Logging, MetricsStorage, MetricType, ReplayDao, ServerIpcNode } from '@lbt-mycrt/common';
import { LocalBackend } from '@lbt-mycrt/common/dist/storage/local-backend';
import { S3Backend } from '@lbt-mycrt/common/dist/storage/s3-backend';
import { getSandboxPath } from '@lbt-mycrt/common/dist/storage/sandbox';
import { launch, ReplayConfig } from '@lbt-mycrt/replay';

import * as session from '../auth/session';
import { getMetrics } from '../common/capture-replay-metrics';
import { startReplay} from '../common/launching';
import { captureDao, environmentDao, environmentInviteDao as inviteDao, replayDao } from '../dao/mycrt-dao';
import { HttpError } from '../http-error';
import * as check from '../middleware/request-validation';
import * as schema from '../request-schema/replay-schema';
import { settings } from '../settings';
import SelfAwareRouter from './self-aware-router';

export default class ReplayRouter extends SelfAwareRouter {
   public name: string = 'replay';
   public urlPrefix: string = '/replays';

   constructor(ipcNode: ServerIpcNode) {
      super(ipcNode, [
         session.loggedInOrForbidden,
      ]);
   }

   protected mountRoutes(): void {
      const logger = Logging.defaultLogger(__dirname);

      this.router.get('/:id(\\d+)', check.validParams(schema.idParams),
            this.handleHttpErrors(async (request, response) => {

         const id = request.params.id;
         const replay = await replayDao.getReplay(id);

         if (!replay) {
            throw new HttpError(http.NOT_FOUND);
         }

         const capture = await captureDao.getCapture(id);
         if (!capture) {
            throw new HttpError(http.NOT_FOUND, `Replay ${replay.id}'s capture does not exist`);
         }

         const environment = await environmentDao.getEnvironment(capture!.envId!);
         if (!environment) {
            throw new HttpError(http.NOT_FOUND, `Replay ${replay.id}'s environment does not exist`);
         }

         const isUserMember = await inviteDao.getUserMembership(request.user!, environment!);
         if (isUserMember.isMember) {
            response.json(replay);
         } else {
            throw new HttpError(http.UNAUTHORIZED);
         }
      }));

      this.router.get('/', check.validQuery(schema.replayQuery),
            this.handleHttpErrors(async (request, response) => {

         const captureId = request.query.captureId;
         const name = request.query.name;
         let replays;

         if (captureId) {
            const capture = await captureDao.getCapture(captureId);
            if (!capture) {
               throw new HttpError(http.NOT_FOUND, `Capture ${captureId} does not exist`);
            }

            const environment = await environmentDao.getEnvironment(capture!.envId!);
            if (!environment) {
               throw new HttpError(http.NOT_FOUND, `Capture ${captureId}'s environment does not exist`);
            }

            const isUserMember = await inviteDao.getUserMembership(request.user!, environment!);
            if (isUserMember.isMember) {
               if (name) {
                  replays = await replayDao.getReplaysForCapByName(captureId, name);
               } else {
                  replays = await replayDao.getReplaysForCapture(captureId);
               }
            } else {
               throw new HttpError(http.UNAUTHORIZED);
            }
         } else {
            replays = await replayDao.getAllReplays(request.user!);
         }
         response.json(replays);
      }));

      this.router.get('/:id(\\d+)/metrics', check.validParams(schema.idParams),
            check.validQuery(schema.metricTypeQuery), this.handleHttpErrors(async (request, response) => {

         const type: MetricType | undefined = request.query.type;
         const replay = await replayDao.getReplay(request.params.id);

         if (!replay) {
            throw new HttpError(http.NOT_FOUND);
         }

         const capture = await captureDao.getCapture(replay.captureId!);
         if (!capture) {
            throw new HttpError(http.BAD_REQUEST, `Replay ${replay.id}'s capture does not exist`);
         }

         const environment = await environmentDao.getEnvironmentFull(capture.envId!);
         if (!environment) {
            throw new HttpError(http.NOT_FOUND, `Replay ${replay.id}'s environment does not exist`);
         }

         const isUserMember = await inviteDao.getUserMembership(request.user!, environment!);
         if (isUserMember.isMember) {
            const result = await getMetrics(capture, environment!, type);
            response.json(result);
         } else {
            throw new HttpError(http.UNAUTHORIZED);
         }
      }));

      this.router.post('/', check.validBody(schema.replayBody), this.handleHttpErrors(async (request, response) => {

         const cap = await captureDao.getCapture(request.body.captureId);
         if (cap == null) {
               throw new HttpError(http.BAD_REQUEST, `Capture ${request.body.captureId} does not exist`);
         }

         const environment = await environmentDao.getEnvironment(cap!.envId!);
         if (!environment) {
            throw new HttpError(http.NOT_FOUND, `Capture ${request.body.captureId}'s environment does not exist`);
         }

         const isUserMember = await inviteDao.getUserMembership(request.user!, environment!);
         if (!isUserMember.isMember) {
            throw new HttpError(http.UNAUTHORIZED);
         }

         const replayWithSameName = replayDao.getReplaysForCapByName(cap!.envId!, request.body.name);
         if (replayWithSameName !== null) {
            throw new HttpError(http.BAD_REQUEST, "Replay with same name already exists for this capture");
         }

         const initialStatus: string | undefined = request.body.status;
         let inputTime: Date = request.body.scheduledStart;

         if (!inputTime) {
            inputTime = new Date();
         }

         if (initialStatus === ChildProgramStatus.SCHEDULED && !request.body.scheduledStart) {
            throw new HttpError(http.BAD_REQUEST, `Cannot schedule without a start schedule time`);
         }

         const dbReference: IDbReference = {
            name: request.body.dbName,
            host: request.body.host,
            user: request.body.user,
            pass: request.body.pass,
            instance: request.body.instance,
            parameterGroup: request.body.parameterGroup,
         };

         const db = await environmentDao.makeDbReference(dbReference);
         if (db) {
            throw new HttpError(http.INTERNAL_SERVER_ERROR, "DB reference was not properly created");
         }

         let replayTemplate: IReplay | null = {
            name: request.body.name,
            captureId: request.body.captureId,
            status: initialStatus === ChildProgramStatus.SCHEDULED ?
               ChildProgramStatus.SCHEDULED : ChildProgramStatus.STARTED,
            dbId: db!.id,
            type: ChildProgramType.REPLAY,
         };

         if (initialStatus === ChildProgramStatus.SCHEDULED) {
            replayTemplate.scheduledStart = inputTime;
         }

         replayTemplate = await replayDao.makeReplay(replayTemplate);

         if (replayTemplate === null) {
            throw new HttpError(http.INTERNAL_SERVER_ERROR, `Replay was not properly created`);
         }

         response.json(replayTemplate);

         if (initialStatus === ChildProgramStatus.SCHEDULED) {
            schedule.scheduleJob(inputTime, () => { startReplay(replayTemplate!); });
         } else {
            startReplay(replayTemplate);
         }

         logger.info(`Successfully created replay!`);
      },
   ));

      this.router.put('/:id(\\d+)', check.validParams(schema.idParams), check.validBody(schema.putReplayBody),
            this.handleHttpErrors(async (request, response) => {

         const replay = await replayDao.getReplay(request.params.id);
         if (!replay) {
            throw new HttpError(http.NOT_FOUND);
         }

         const capture = await captureDao.getCapture(replay!.captureId!);
         if (!capture) {
            throw new HttpError(http.NOT_FOUND, `Replay ${replay.id}'s capture does not exist`);
         }

         const environment = await environmentDao.getEnvironment(capture!.envId!);
         if (!environment) {
            throw new HttpError(http.NOT_FOUND, `Replay ${replay.id}'s environment does not exist`);
         }

         const isUserMember = await inviteDao.getUserMembership(request.user!, environment!);
         if (request.user! !== capture!.ownerId && !isUserMember.isAdmin) {
            throw new HttpError(http.UNAUTHORIZED);
         }

         const replayWithSameName = replayDao.getReplaysForCapByName(capture!.envId!, request.body.name);
         if (replayWithSameName !== null) {
            throw new HttpError(http.BAD_REQUEST, "Replay with same name already exists for this capture");
         }

         const updateReplay = await replayDao.updateReplayName(replay.id!, request.body.name);
         response.status(http.OK).end();
      }));

      this.router.delete('/:id(\\d+)', check.validParams(schema.idParams),
            check.validQuery(schema.deleteLogsQuery),
            this.handleHttpErrors(async (request, response) => {

         const replay = await replayDao.getReplay(request.params.id);
         if (!replay) {
            throw new HttpError(http.NOT_FOUND);
         }

         const capture = await captureDao.getCapture(replay.captureId!);
         if (capture === null) {
            throw new HttpError(http.BAD_REQUEST, `Replay ${replay.id}'s capture does not exist`);
         }

         const env = await environmentDao.getEnvironmentFull(capture.envId!);
         if (!env) {
            throw new HttpError(http.NOT_FOUND, `Replay ${replay.id}'s environment does not exist`);
         }

         const isUserMember = await inviteDao.getUserMembership(request.user!, env!);
         if (request.user! !== capture!.ownerId && !isUserMember.isAdmin) {
            throw new HttpError(http.UNAUTHORIZED);
         }

         const replayDel = await replayDao.deleteReplay(request.params.id);

         if (request.query.deleteLogs === true && env) {

            const storage = new S3Backend(
               new S3({region: env.region,
                        accessKeyId: env.accessKey,
                        secretAccessKey: env.secretKey}),
                     env.bucket, env.prefix,
               );

            const replayPrefix = `environment${env.id}/replay${request.params.id}/`;
            await storage.deletePrefix(replayPrefix);
         }
         response.status(http.OK).end();
      }));
   }
}
