import * as http from 'http-status-codes';

import { ChildProgramStatus, ChildProgramType, IReplay, Logging } from '@lbt-mycrt/common';
import { launch, ReplayConfig } from '@lbt-mycrt/replay';

import { replayDao } from '../dao/mycrt-dao';
import * as check from '../middleware/request-validation';
import * as schema from '../request-schema/replay-schema';
import { settings } from '../settings';
import SelfAwareRouter from './self-aware-router';

export default class ReplayRouter extends SelfAwareRouter {
   public name: string = 'replay';
   public urlPrefix: string = '/replays';

   protected mountRoutes(): void {
      const logger = Logging.defaultLogger(__dirname);

      this.router.get('/', this.tryCatch500(async (request, response) => {
         const replays = await replayDao.getAllReplays();
         response.json(replays);
      }));

      this.router.get('/:id(\\d+)', check.validParams(schema.idParams), this.tryCatch500(async (request, response) => {
         const id = request.params.id;
         const replay = await replayDao.getReplay(id);
         response.json(replay);
      }));

      this.router.post('/', check.validBody(schema.replayBody), this.tryCatch500(async (request, response) => {

         const replayTemplate: IReplay = {
            name: request.body.name,
            captureId: request.body.captureId,
            type: ChildProgramType.REPLAY,
            status: ChildProgramStatus.STARTED, // no scheduled replays yet
         };

         const replay = await replayDao.makeReplay(replayTemplate);

         logger.info(`Launching replay with id ${replay.id!} for capture ${replay.captureId!}`);
         const config = new ReplayConfig(replay.id!, replay.captureId!);
         config.mock = settings.replays.mock;
         config.interval = settings.replays.interval;
         config.intervalOverlap = settings.replays.intervalOverlap;

         launch(config);
         response.json(replay);
         logger.info(`Successfully created replay!`);

      }));

   }
}
