// import { check, validationResult } from 'express-validator/check';
// import { matchedData } from 'express-validator/filter';
import * as http from 'http-status-codes';

import { ChildProgramStatus, ChildProgramType, IReplay, Logging } from '@lbt-mycrt/common';
import { launch, ReplayConfig } from '@lbt-mycrt/replay';

import { replayDao } from '../dao/mycrt-dao';
import { settings } from '../settings';
import SelfAwareRouter from './self-aware-router';

// import { captureExists } from './validators/replay-validators';

export default class ReplayRouter extends SelfAwareRouter {
   public name: string = 'replay';
   public urlPrefix: string = '/replays';

   protected mountRoutes(): void {
      const logger = Logging.defaultLogger(__dirname);

      this.router.get('/', async (request, response) => {
         try {
            const replays = await replayDao.getAllReplays();
            response.json(replays);
         } catch (error) {
            // TODO: send error message
            logger.error(error);
            response.status(http.INTERNAL_SERVER_ERROR).end();
         }
      });

      this.router.get('/:id', async (request, response) => {
         const id = request.params.id;
         try {
            const replay = await replayDao.getReplay(id);
            response.json(replay);
         } catch (error) {
            // TODO: send an error message
            logger.error(error);
            response.status(http.INTERNAL_SERVER_ERROR).end();
         }
      });

      this.router.post('/',
            // check('name').exists(),
            // check('captureId').isNumeric().custom(captureExists),
            async (request, response) => {

         // const errors = validationResult(request);
         // if (!errors.isEmpty()) {
         //    response.status(http.BAD_REQUEST).json(errors.array());
         //    return;
         // }
         // const replay = matchedData(request);

         const replayTemplate: IReplay = {
            name: request.body.name,
            captureId: request.body.captureId,
            type: ChildProgramType.REPLAY,
            status: ChildProgramStatus.STARTED, // no scheduled replays yet
         };

         try {
            const replay = await replayDao.makeReplay(replayTemplate);

            logger.info(`Launching replay with id ${replay.id!} for capture ${replay.captureId!}`);
            const config = new ReplayConfig(replay.id!, replay.captureId!);
            config.mock = settings.replays.mock;
            config.interval = settings.replays.interval;
            config.intervalOverlap = settings.replays.intervalOverlap;

            launch(config);

            logger.info(`Successfully created replay!`);
            response.json(replay);

         } catch (error) {
            // TODO: send an error
            logger.error(error);
            response.status(http.INTERNAL_SERVER_ERROR).end();
         }

      });

   }
}
