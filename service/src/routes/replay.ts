import * as http from 'http-status-codes';

import { ChildProgramStatus, ChildProgramType, IDbReference, IReplay,
      Logging, MetricsStorage, MetricType, ReplayDao } from '@lbt-mycrt/common';
import { launch, ReplayConfig } from '@lbt-mycrt/replay';
import schedule = require('node-schedule');

import { LocalBackend } from '@lbt-mycrt/common/dist/storage/local-backend';
import { S3Backend } from '@lbt-mycrt/common/dist/storage/s3-backend';
import { getSandboxPath } from '@lbt-mycrt/common/dist/storage/sandbox';

import { getMetrics } from '../common/capture-replay-metrics';
import { startReplay} from '../common/launching';
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
            const name = request.query.name;
            let replays;

            if (captureId) {
                  logger.info(`Getting all replays for capture ${captureId}`);
                  replays = await replayDao.getReplaysForCapture(captureId);
                  if (name) {
                     replays = await replayDao.getReplaysForCapByName(captureId, name);
                  }
            } else {
               replays = await replayDao.getAllReplays();
            }
            response.json(replays);
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
         const initialStatus: string | undefined = request.body.status;
         let inputTime: Date = request.body.scheduledStart;  // retrieve scheduled time

         logger.debug(`time is: ${inputTime}`);
         if (!inputTime) {
            inputTime = new Date();
         }

         logger.debug("here2");
         const cap = await captureDao.getCapture(request.body.captureId);
         if (cap == null) {
               throw new HttpError(http.BAD_REQUEST, `Capture ${request.body.captureId} does not exist`);
         }

         logger.debug("here3");
         if (initialStatus === ChildProgramStatus.SCHEDULED && !request.body.scheduledStart) {
            throw new HttpError(http.BAD_REQUEST, `Cannot schedule without a start schedule time`);
         }

         logger.debug("here4");
         let dbReference: IDbReference = {
            name: request.body.dbName,
            host: request.body.host,
            user: request.body.user,
            pass: request.body.pass,
            instance: request.body.instance,
            parameterGroup: request.body.parameterGroup,
         };

         const db = await environmentDao.makeDbReference(dbReference);
         if (db && !db.id) {
            logger.debug("here5");
            throw new HttpError(http.BAD_REQUEST, "DB reference was not properly created");
         }

         if (db) {
            logger.debug("here6");
            dbReference = db;
         }

         logger.debug("here7");
         let replayTemplate: IReplay | null = {
            name: request.body.name,
            captureId: request.body.captureId,
            status: initialStatus === ChildProgramStatus.SCHEDULED ?
               ChildProgramStatus.SCHEDULED : ChildProgramStatus.STARTED,
            dbId: dbReference.id!,
            type: ChildProgramType.REPLAY,
         };

         // if status is scheduled, start at a scheduled time
         if (initialStatus === ChildProgramStatus.SCHEDULED) {
            logger.debug("here8");
            replayTemplate.scheduledStart = inputTime;
         }

         logger.debug("here9");
         replayTemplate = await replayDao.makeReplay(replayTemplate);

         logger.debug("here10");
         if (replayTemplate === null) {
            throw new HttpError(http.INTERNAL_SERVER_ERROR, `error creating replay in db`);
         }

         logger.debug("here11");
         response.json(replayTemplate);

         // logger.debug(initialStatus.toString());
         if (initialStatus === ChildProgramStatus.SCHEDULED) {
            logger.debug("here13");
            schedule.scheduleJob(inputTime, () => { startReplay(replayTemplate!); });
         } else {
            logger.debug("here14");
            startReplay(replayTemplate);
         }

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
