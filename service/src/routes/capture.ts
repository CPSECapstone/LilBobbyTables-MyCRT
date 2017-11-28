import { launch } from '@lbt-mycrt/capture';
import { Logging } from '@lbt-mycrt/common';
import * as http from 'http-status-codes';
import * as mysql from 'mysql';
import SelfAwareRouter from './self-aware-router';

export default class CaptureRouter extends SelfAwareRouter {
   public name: string = 'capture';
   public urlPrefix: string = '/capture';

   protected mountRoutes(): void {
      const logger = Logging.defaultLogger(__dirname);
      const config = require('../../db/config.json');

      this.router
         .get('/', (request, response) => {
            const conn = mysql.createConnection(config);

            conn.connect((connErr) => {
               if (connErr) {
                  throw connErr;
               } else {
                  const queryStr = mysql.format("SELECT * FROM Capture", []);
                  conn.query(queryStr, (queryErr, rows) => {
                     if (queryErr) {
                        throw queryErr;
                     } else {
                        response.json(rows);
                        conn.end();
                     }
                  });
               }
            });
         })

         .get('/:id', (request, response) => {
            const id = request.params.id;
            const conn = mysql.createConnection(config);

            conn.connect((connErr) => {
               if (connErr) {
                  throw connErr;
               } else {
                  const queryStr = mysql.format("SELECT * FROM Capture WHERE id = ?", [id]);
                  conn.query(queryStr, (queryErr, rows) => {
                     if (queryErr) {
                        throw queryErr;
                     } else {
                        response.json(rows[0]);
                        conn.end();
                     }
                  });
               }
            });
         })

         .post('/:id/stop', async (request, response) => {

            const captureId = request.params.id;
            const s3res: any = await this.ipcNode.stopCapture(captureId);
            response.json(s3res).end();

         })

         .post('/', (request, response) => {

            /* Add validation for insert */
            const capture = request.body;

            logger.info('Creating Capture');
            const conn = mysql.createConnection(config);
            conn.connect((connErr) => {
               if (connErr) {
                  throw connErr;
               } else {
                  const insertStr = mysql.format("INSERT INTO Capture SET ?", capture);
                  conn.query(insertStr, (queryErr, result) => {
                     if (queryErr) {
                        throw queryErr;
                     } else {
                        conn.end();

                        logger.info(`Launching capture with id ${result.insertId}`);
                        launch({ id: result.insertId });

                        logger.info(`Successfully created capture!`);
                        response.json(result.insertId).end();

                     }
                  });
               }
            });
         })
      ;
   }
}
