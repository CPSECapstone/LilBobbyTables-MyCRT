import { launch } from '@lbt-mycrt/capture';
import { ChildProgramStatus, ChildProgramType, IMetric,
         IMetricsList, Logging, MetricsBackend, MetricType } from '@lbt-mycrt/common';
import { LocalBackend } from '@lbt-mycrt/common/dist/storage/local-backend';
import * as http from 'http-status-codes';
import * as mysql from 'mysql';
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
               response.json(row);
            });
         })

         .get('/:id/metrics', (request, response) => {
            const typeQuery: any = request.query.type;
            const type: MetricType | undefined = typeQuery && typeQuery.toString().toUpperCase() as MetricType;
            const backend: MetricsBackend = new MetricsBackend(new LocalBackend(''));
            const result = backend.readMetrics({
               id: parseInt(request.params.id),
               name: "name",
               status: ChildProgramStatus.DEAD,
               type: ChildProgramType.CAPTURE,
               start: new Date().toString(),
               end: new Date().toString(),
            }, type);
            if (result === null) {
               response.status(http.BAD_REQUEST).end();
            } else {
               response.json(result).end();
            }
         })

         .post('/:id/stop', async (request, response) => {

            const captureId = request.params.id;
            const s3res: any = await this.ipcNode.stopCapture(captureId);
            response.json(s3res).end();

         })

         .post('/', (request, response) => {
            const capture = request.body;
            capture.status = "queued";
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
