import * as http from 'http-status-codes';

import { ChildProgramStatus, ChildProgramType, IDbReference, IReplay,
      Logging, MetricsStorage, MetricType } from '@lbt-mycrt/common';
import { launch, ReplayConfig } from '@lbt-mycrt/replay';

import { LocalBackend } from '@lbt-mycrt/common/dist/storage/local-backend';
import { S3Backend } from '@lbt-mycrt/common/dist/storage/s3-backend';
import { getSandboxPath } from '@lbt-mycrt/common/dist/storage/sandbox';

import { getMetrics } from '../common/capture-replay-metrics';
import { captureDao, environmentDao, replayDao } from '../dao/mycrt-dao';
import { HttpError } from '../http-error';
import * as check from '../middleware/request-validation';
import * as schema from '../request-schema/replay-schema';
import { settings } from '../settings';
import SelfAwareRouter from './self-aware-router';

export default class ReplayRouter extends SelfAwareRouter {
   public name: string = 'replay';
   public urlPrefix: string = '/replays';

   protected mountRoutes(): void {
      const logger = Logging.defaultLogger(__dirname);

      this.router.get('/:id(\\d+)', check.validParams(schema.idParams),
            this.handleHttpErrors(async (request, response) => {

         const id = request.params.id;
         const replay = await replayDao.getReplay(id);
         if (!replay) {
            throw new HttpError(http.NOT_FOUND);
         }
         response.json(replay);

      }));

      this.router.get('/', check.validQuery(schema.replayQuery),
            this.handleHttpErrors(async (request, response) => {
            const captureId = request.query.captureId;

            if (captureId) {
                  logger.info(`Getting all replays for capture ${captureId}`);
                  const replays = await replayDao.getReplaysForCapture(captureId);
                  response.json(replays);
            } else {
                  const replays = await replayDao.getAllReplays();
                  response.json(replays);
            }
      }));

      this.router.get('/:id(\\d+)/metrics', check.validParams(schema.idParams),
            check.validQuery(schema.metricTypeQuery), this.handleHttpErrors(async (request, response) => {

         const type: MetricType | undefined = request.query.type;
         const replay = await replayDao.getReplay(request.params.id);
         if (replay === null) {
            throw new HttpError(http.NOT_FOUND);
         } else if (!replay.captureId) {
            throw new HttpError(http.CONFLICT, `Replay ${replay.id} has no captureId`);
         }

         const capture = await captureDao.getCapture(replay.captureId);
         if (capture === null) {
            throw new HttpError(http.CONFLICT, `Replay ${replay.id}'s capture does not exist`);
         } else if (!capture.envId) {
            throw new HttpError(http.CONFLICT, `Replay ${replay.id}'s has no envId`);
         }

         const environment = await environmentDao.getEnvironmentFull(capture.envId);
         if (environment === null) {
            throw new HttpError(http.CONFLICT, `Replay ${replay.id}'s environment does not exist`);
         }

         const result = await getMetrics(replay, environment, type);
         response.json(result);

      }));

      this.router.post('/', check.validBody(schema.replayBody), this.handleHttpErrors(async (request, response) => {
         const dbRefArgs: IDbReference = {
            name: request.body.dbName,
            host: request.body.host,
            user: request.body.user,
            pass: request.body.pass,
            instance: request.body.instance,
         };

         const dbRef = await environmentDao.makeDbReference(dbRefArgs);
         if (dbRef && !dbRef.id) {
            throw new HttpError(http.BAD_REQUEST, "DB reference was not properly created");
         }

         const cap = await captureDao.getCapture(request.body.captureId);
         if (cap == null) {
               throw new HttpError(http.BAD_REQUEST, `Capture ${request.body.captureId} does not exist`);
         }

         let dbReference: IDbReference = {
            name: request.body.dbName,
            host: request.body.host,
            user: request.body.user,
            pass: request.body.pass,
            instance: request.body.instance,
            parameterGroup: request.body.parameterGroup,
         };

         const db = await environmentDao.makeDbReference(dbReference);
         if (db) {
            dbReference = db;
         }

         const replayTemplate: IReplay = {
            name: request.body.name,
            captureId: request.body.captureId,
            dbId: dbReference.id!,
            type: ChildProgramType.REPLAY,
            status: ChildProgramStatus.STARTED, // no scheduled replays yet
         };

         const replay = await replayDao.makeReplay(replayTemplate);

         logger.info(`Launching replay with id ${replay!.id!} for capture ${replay!.captureId!}`);
         const config = new ReplayConfig(replay!.id!, replay!.captureId!, replay!.dbId!);
         config.mock = settings.replays.mock;
         config.interval = settings.replays.interval;
         config.intervalOverlap = settings.replays.intervalOverlap;

         launch(config);
         response.json(replay);
         logger.info(`Successfully created replay!`);

      }));

      this.router.delete('/:id(\\d+)', check.validParams(schema.idParams),
            this.handleHttpErrors(async (request, response) => {

         const id = request.params.id;
         const replay = await replayDao.deleteReplay(id);
         if (!replay) {
            throw new HttpError(http.NOT_FOUND);
         }
         response.json(replay);

      }));

   }
}
