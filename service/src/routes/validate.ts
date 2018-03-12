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

   private logger = Logging.defaultLogger(__dirname);

   protected mountRoutes(): void {

      this.router.post('/credentials', check.validBody(schema.credentialsBody),
         this.handleHttpErrors(async (request, response) => {

         const rds = new RDS({
            region: request.body.region,
            accessKeyId: request.body.accessKey,
            secretAccessKey: request.body.secretKey,
         });
         const params = {};

         try {
            const data = await this.getDBInstances(rds, params);
            const instances: any = [];
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
            response.json(instances);
         } catch (e) {
            throw new HttpError(http.BAD_REQUEST, "Credentials are invalid");
         }
      }));

      this.router.post('/database', check.validBody(schema.databaseBody),
         this.handleHttpErrors(async (request, response) => {
         const connection = mysql.createConnection({
            host : request.body.host,
            user : request.body.user,
            password : request.body.pass,
            database : request.body.dbName,
         });

         try {
            const conn = await this.getDBConnection(connection);
            response.status(http.OK).end();
         } catch (e) {
            throw new HttpError(http.BAD_REQUEST, "Can't connect to the database");
         }
      }));

      this.router.post('/bucket', check.validBody(schema.credentialsBody),
         this.handleHttpErrors(async (request, response) => {
         const s3 = new S3({
            region: request.body.region,
            accessKeyId: request.body.accessKey,
            secretAccessKey: request.body.secretKey,
         });
         const params = {};

         try {
            const data = await this.getBuckets(s3, params);
            const buckets: any = [];
            data.Buckets.forEach((bucket: S3.Bucket) => {
               buckets.push(bucket.Name);
            });
            response.json(buckets);
         } catch (e) {
            throw new HttpError(http.BAD_REQUEST, "Credentials are invalid");
         }
      }));
   }

   private getDBInstances(rds: RDS, params: any): Promise<any> {
      return new Promise((resolve, reject) => {
         rds.describeDBInstances(params, (err, data) => {
            if (err) {
               reject(err);
            } else {
               resolve(data);
            }
         });
      });
   }

   private getDBConnection(connection: mysql.Connection): Promise<any> {
      return new Promise((resolve, reject) => {
         connection.connect((err) => {
            if (err) {
               reject(err);
            } else {
               resolve(connection);
            }
         });
      });
   }

   private getBuckets(s3: S3, params: any): Promise<any> {
      return new Promise((resolve, reject) => {
         s3.listBuckets((err, data) => {
            if (err) {
               reject(err);
            } else {
               resolve(data);
            }
         });
      });
   }
}
