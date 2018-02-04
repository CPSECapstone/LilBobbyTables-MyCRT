import { S3 } from 'aws-sdk';
import * as http from 'http-status-codes';
import * as mysql from 'mysql';

import { CaptureConfig, launch } from '@lbt-mycrt/capture';
import { ChildProgramStatus, ChildProgramType, IMetric,
         IMetricsList, Logging, MetricsBackend, MetricType } from '@lbt-mycrt/common';
import { S3Backend } from '@lbt-mycrt/common/dist/storage/s3-backend';

import { settings } from '../settings';
import SelfAwareRouter from './self-aware-router';
import ConnectionPool from './util/cnnPool';

export default class CaptureRouter extends SelfAwareRouter {
   public name: string = 'capture';
   public urlPrefix: string = '/captures';

   protected mountRoutes(): void {
      const logger = Logging.defaultLogger(__dirname);

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
               if (row.length) {
                  response.json(row[0]).end();
               } else {
                  response.status(http.NOT_FOUND).end();
               }
            });
         })

         .get('/:id/metrics', async (request, response) => {

            const typeQuery: any = request.query.type;
            const type: MetricType | undefined = typeQuery && typeQuery.toString().toUpperCase() as MetricType;

            const backend: MetricsBackend = new MetricsBackend(new S3Backend(new S3(), 'lil-test-environment'));

            const result = await backend.readMetrics({
               id: parseInt(request.params.id),
               name: "name",
               status: ChildProgramStatus.DEAD,
               type: ChildProgramType.CAPTURE,
               start: new Date(),
               end: new Date(),
            }, type).catch((reason) => {
               response.status(http.INTERNAL_SERVER_ERROR).json({reason}).end();
            });

            if (result === null) {
               response.status(http.BAD_REQUEST).end();
            } else {
               response.json(result).end();
            }
         })

         .post('/:id/stop', async (request, response) => {

            const captureId = request.params.id;
            await this.ipcNode.stopCapture(captureId).catch((reason) => {
               logger.error(`Failed to stop capture ${captureId}: ${reason}`);
            });
            logger.info(`Capture ${captureId} stopped!`);
            response.status(http.OK).end();

         })

         .post('/', (request, response) => {
            const capture = request.body;
            capture.status = "queued";
            const insertStr = mysql.format("INSERT INTO Capture SET ?", capture);
            logger.info('Creating Capture');

            /* Add validation for insert */
            ConnectionPool.query(response, insertStr, (error, result) => {
               logger.info(`Launching capture with id ${result.insertId}`);

               const config = new CaptureConfig(result.insertId);
               config.mock = settings.captures.mock;
               config.interval = settings.captures.interval;

               launch(config);

               logger.info(`Successfully created capture!`);
               response.json({id: result.insertId}).end(); // TODO: query for the capture, and return the whole object

            });
         })
      ;
   }
}
