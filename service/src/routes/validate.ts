import { RDS, S3 } from 'aws-sdk';
import * as mysql from 'mysql';

import http = require('http-status-codes');

import { Logging } from '@lbt-mycrt/common/dist/main';

import { HttpError } from '../http-error';
import * as check from '../middleware/request-validation';
import * as schema from '../request-schema/validate-schema';
import SelfAwareRouter from './self-aware-router';

export default class ValidateRouter extends SelfAwareRouter {

   public name: string = 'validate';
   public urlPrefix: string = '/validate';

   protected mountRoutes(): void {
      const logger = Logging.defaultLogger(__dirname);

      this.router.get('/', this.handleHttpErrors(async (request, response) => {
         response.sendStatus(http.OK);
      }));

      this.router.post('/credentials', check.validBody(schema.credentialsBody),
         this.handleHttpErrors(async (request, response) => {

         const rds = new RDS({
            region: request.body.region,
            accessKeyId: request.body.accessKey,
            secretAccessKey: request.body.secretKey,
         });

         const params = {};
         rds.describeDBInstances(params, (err, data) => {
            if (err) {
               response.sendStatus(400);
            } else {
               const instances: any = [];
               if (data.DBInstances) {
                  data.DBInstances.forEach((dbInstance: RDS.DBInstance) => {
                     instances.push({
                        instance: dbInstance.DBInstanceIdentifier,
                        name: dbInstance.DBName,
                        user: dbInstance.MasterUsername,
                        host: dbInstance.Endpoint ? dbInstance.Endpoint.Address : "",
                        parameterGroup: dbInstance.DBParameterGroups ?
                           dbInstance.DBParameterGroups[0].DBParameterGroupName : "",
                     });
                  });
               }
               response.json(instances);
            }
         });
      }));

      this.router.post('/database', check.validBody(schema.databaseBody),
         this.handleHttpErrors(async (request, response) => {
            const connection = mysql.createConnection({
               host : request.body.host,
               user : request.body.user,
               password : request.body.pass,
               database : request.body.dbName,
            });

            connection.connect((err) => {
               if (err) {
                  response.sendStatus(400);
               } else {
                  connection.destroy();
                  response.sendStatus(http.OK);

               }
            });
      }));

      this.router.post('/bucket', check.validBody(schema.credentialsBody),
         this.handleHttpErrors(async (request, response) => {
            const s3 = new S3({
               region: request.body.region,
               accessKeyId: request.body.accessKey,
               secretAccessKey: request.body.secretKey,
            });

            const params = {};
            s3.listBuckets((err, data) => {
               if (err || !data.Buckets) {
                  response.sendStatus(400);
               } else {
                  const buckets: any = [];
                  data.Buckets.forEach((bucket: S3.Bucket) => {
                     buckets.push(bucket.Name);
                  });
                  response.json(buckets);
               }
            });
      }));
   }
}
