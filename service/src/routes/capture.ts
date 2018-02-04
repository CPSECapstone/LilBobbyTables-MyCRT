import { S3 } from 'aws-sdk';
import * as http from 'http-status-codes';
import * as mysql from 'mysql';

import { CaptureConfig, launch } from '@lbt-mycrt/capture';
import { ChildProgramStatus, ChildProgramType, IChildProgram, IMetric,
         IMetricsList, Logging, MetricsStorage, MetricType } from '@lbt-mycrt/common';
import { LocalBackend } from '@lbt-mycrt/common/dist/storage/local-backend';
import { S3Backend } from '@lbt-mycrt/common/dist/storage/s3-backend';
import { getSandboxPath } from '@lbt-mycrt/common/dist/storage/sandbox';

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

         .get('/:id/metrics', (request, response) => {

            const typeQuery = request.query.type;
            const type: MetricType | undefined = typeQuery && typeQuery.toString().toUpperCase() as MetricType;

            // TODO: add configuration for choosing the backend
            // const storage: MetricsStorage = new MetricsStorage(new S3Backend(new S3(), 'lil-test-environment'));
            const storage = new MetricsStorage(new LocalBackend(getSandboxPath()));

            logger.info(`Getting ${type} metrics for capture ${request.params.id}`);
            const getCaptureQuery = mysql.format("SELECT * FROM Capture WHERE id = ?", [request.params.id]);
            ConnectionPool.query(response, getCaptureQuery, async (error, rows, fields) => {
               if (!rows.length) {
                  logger.error(`Capture ${request.params.id} does not exist`);
                  response.status(http.NOT_FOUND).end();
               } else {
                  const row = rows[0];
                  const capture: IChildProgram = {
                     id: parseInt(request.params.id),
                     name: row.name,
                     status: row.status.toUpperCase(),
                     type: ChildProgramType.CAPTURE,
                     start: new Date(row.start),
                     end: row.end ? new Date(row.end) : undefined,
                  };

                  try {
                     const result = await storage.readMetrics(capture, type);
                     if (!result) {
                        logger.error(`Failed to read metrics`);
                        response.status(http.BAD_REQUEST).end();
                     } else {
                        logger.info("Successfully read metrics");
                        response.json(result);
                     }
                  } catch (error) {
                     logger.error(`Failed to retrieve metrics: ${error}`);
                     response.status(http.INTERNAL_SERVER_ERROR).end();
                  }
               }
            });

         })

         .post('/:id/stop', async (request, response) => {

            try {
               const captureId = request.params.id;
               await this.ipcNode.stopCapture(captureId);
               logger.info(`Capture ${captureId} stopped!`);
               response.status(http.OK).end();
            } catch (error) {
               logger.error(`Failed to tell capture to stop: ${error}`);
               response.status(http.INTERNAL_SERVER_ERROR).end();
            }

         })

         .post('/', (request, response) => {
            const capture = request.body;
            capture.status = ChildProgramStatus.STARTED; // no scheduled captures yet
            const insertStr = mysql.format("INSERT INTO Capture SET ?", capture);
            logger.info('Creating Capture');

            /* Add validation for insert */
            ConnectionPool.query(response, insertStr, (error, result) => {
               logger.info(`Launching capture with id ${result.insertId}`);

               const config = new CaptureConfig(result.insertId);
               config.mock = settings.captures.mock;
               config.interval = settings.captures.interval;
               config.intervalOverlap = settings.captures.intervalOverlap;

               launch(config);

               logger.info(`Successfully created capture!`);
               response.json({id: result.insertId}).end(); // TODO: query for the capture, and return the whole object

            });
         })
      ;
   }
}
