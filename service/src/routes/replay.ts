// import { check, validationResult } from 'express-validator/check';
// import { matchedData } from 'express-validator/filter';
import * as http from 'http-status-codes';
import * as mysql from 'mysql';

import { Logging } from '@lbt-mycrt/common';
import { launch, ReplayConfig } from '@lbt-mycrt/replay';

import { settings } from '../settings';
import SelfAwareRouter from './self-aware-router';
import ConnectionPool from './util/cnnPool';

// import { captureExists } from './validators/replay-validators';

export default class ReplayRouter extends SelfAwareRouter {
   public name: string = 'replay';
   public urlPrefix: string = '/replays';

   protected mountRoutes(): void {
      const logger = Logging.defaultLogger(__dirname);

      this.router
         .get('/', (request, response) => {
            const queryStr = mysql.format('SELECT * FROM Replay', []);
            ConnectionPool.query(response, queryStr, (error, rows, fields) => {
               if (error) {
                  response.status(http.INTERNAL_SERVER_ERROR).json({error}).end();
               } else {
                  response.json(rows).end();
               }
            });
         })

         .get('/:id', (request, response) => {
            const id = request.params.id;
            const queryStr = mysql.format('SELECT * FROM Replay WHERE id = ?', [id]);
            ConnectionPool.query(response, queryStr, (error, row, fields) => {
               if (error) {
                  response.status(http.INTERNAL_SERVER_ERROR).json({error}).end();
               } else if (row.length) {
                  response.json(row[0]).end();
               } else {
                  response.status(http.NOT_FOUND).end();
               }
            });
         })

         .post('/',
            // check('name').exists(),
            // check('captureId').isNumeric().custom(captureExists),
         (request, response) => {

            // const errors = validationResult(request);
            // if (!errors.isEmpty()) {
            //    response.status(http.BAD_REQUEST).json(errors.array());
            //    return;
            // }

            // const replay = matchedData(request);
            const replay = request.body;
            replay.status = 'queued';
            delete replay.type; // should be removed in a better way
            const insertStr = mysql.format('INSERT INTO Replay SET ?', [replay]);
            logger.info('Creating Replay');

            /* Add validation for insert */
            ConnectionPool.query(response, insertStr, (error, result) => {
               logger.info(`Launching replay with id ${result.insertId}`);

               const config = new ReplayConfig(result.insertId, replay.captureId);
               config.mock = settings.replays.mock;
               config.interval = settings.replays.interval;
               config.intervalOverlap = settings.replays.intervalOverlap;
               launch(config);

               logger.info(`Successfully created replay!`);
               response.json(result.insertId);
            });

         })

      ;
   }
}
