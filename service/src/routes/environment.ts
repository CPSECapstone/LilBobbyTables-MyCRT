import * as http from 'http-status-codes';
import * as mysql from 'mysql';

import { Logging } from '@lbt-mycrt/common';
import SelfAwareRouter from './self-aware-router';
import ConnectionPool from './util/cnnPool';

export default class EnvironmentRouter extends SelfAwareRouter {
   public name: string = 'environment';
   public urlPrefix: string = '/environments';

   protected mountRoutes(): void {
      const logger = Logging.defaultLogger(__dirname);

      this.router
         .get('/', (request, response) => {
            const queryStr = mysql.format('SELECT * FROM Environment', []);
            ConnectionPool.query(response, queryStr, (error, rows, fields) => {
               response.json(rows);
            });
         })

         .get('/:id', (request, response) => {
            const id = request.params.id;
            const queryStr = mysql.format("SELECT * FROM Environment WHERE id = ?", [id]);
            ConnectionPool.query(response, queryStr, (error, row, fields) => {
               if (row.length) {
                  response.json(row[0]);
               } else {
                  response.sendStatus(http.NOT_FOUND);
               }
            });
         })

         .post('/', (request, response) => {
            /* Add validation to check that all fields exist */
            try {
               const iamReference: any = {
                  accessKey : request.body.accessKey,
                  secretKey : request.body.secretKey,
                  region : request.body.region,
               };
               const s3Reference: any = {
                  bucket : request.body.bucket,
               };
               const dbReference: any = {
                  name : request.body.dbName,
                  host : request.body.host,
                  user : request.body.user,
                  pass : request.body.pass,
               };

               const insertIamStr = mysql.format("INSERT INTO IAMReference SET ?", iamReference);
               const insertS3Str = mysql.format("INSERT INTO S3Reference SET ?", s3Reference);
               const insertDbStr = mysql.format("INSERT INTO DBReference SET ?", dbReference);

               let iamInsertId: number = 0;
               let s3InsertId: number = 0;
               let dbInsertId: number = 0;

               ConnectionPool.query(response, insertIamStr, (iamError, iamResult) => {
                  logger.info("Inserting IAM Reference to db with id " + iamResult.insertId);
                  iamInsertId = iamResult.insertId;

                  ConnectionPool.query(response, insertS3Str, (s3Error, s3Result) => {
                     logger.info("Inserting S3 Reference to db with id " + s3Result.insertId);
                     s3InsertId = s3Result.insertId;

                     ConnectionPool.query(response, insertDbStr, (dbError, dbResult) => {
                        logger.info("Inserting DB Reference to db with id " + dbResult.insertId);
                        dbInsertId = dbResult.insertId;

                        const environment: any = {
                           name : request.body.envName,
                           iamId : iamInsertId,
                           s3Id : s3InsertId,
                           dbId : dbInsertId,
                        };
                        const insertEnvStr = mysql.format("INSERT INTO Environment SET ?", environment);

                        ConnectionPool.query(response, insertEnvStr, (error, result) => {
                           logger.info("Inserting Environment to db with id " + result.insertId);
                           response.json({id: result.insertId});
                        });
                     });
                  });
               });
            } catch (e) {
               response.sendStatus(http.BAD_REQUEST);
            }
         })
      ;
   }
}
