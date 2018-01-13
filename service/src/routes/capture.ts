import { launch } from '@lbt-mycrt/capture';
import { Logging } from '@lbt-mycrt/common';
import * as http from 'http-status-codes';
import * as mysql from 'mysql';
import SelfAwareRouter from './self-aware-router';
import ConnectionPool from './util/cnnPool';

export default class CaptureRouter extends SelfAwareRouter {
   public name: string = 'capture';
   public urlPrefix: string = '/captures';

   protected mountRoutes(): void {
      const logger = Logging.defaultLogger(__dirname);
      const config = require('../../db/config.json');

      this.router
         .get('/', (request, response) => {
            const queryStr = mysql.format("SELECT * FROM Capture", []);
            ConnectionPool.query(response, queryStr, (error, rows, fields) => {
               response.json(rows);
            });
         })

         .get('/:id', (request, response) => {
            const id = request.params.id;
            const queryStr = mysql.format("SELECT * FROM Capture WHERE id = ?", [id]);
            ConnectionPool.query(response, queryStr, (error, row, fields) => {
               response.json(row);
            });
         })

         .post('/:id/stop', async (request, response) => {

            const captureId = request.params.id;
            const s3res: any = await this.ipcNode.stopCapture(captureId);
            response.json(s3res).end();

         })

         .post('/', (request, response) => {
            const capture = request.body;
            const insertStr = mysql.format("INSERT INTO Capture SET ?", capture);
            logger.info('Creating Capture');

            /* Add validation for insert */
            ConnectionPool.query(response, insertStr, (error, result) => {
               logger.info(`Launching capture with id ${result.insertId}`);
               launch({ id: result.insertId });

               logger.info(`Successfully created capture!`);
               response.json(result.insertId);

            });
         })
      ;
   }
}
