import { RDS, S3 } from 'aws-sdk';
import * as mysql from 'mysql';

import http = require('http-status-codes');

import { Check, Logging, ServerIpcNode } from '@lbt-mycrt/common';
import { MetricsStorage } from '@lbt-mycrt/common/dist/metrics/metrics-storage';
import { StorageBackend } from '@lbt-mycrt/common/dist/storage/backend';
import { S3Backend } from '@lbt-mycrt/common/dist/storage/s3-backend';

import { makeSureUserIsEnvironmentMember } from '../auth/middleware';
import * as session from '../auth/session';
import { getDbInstances } from '../common/rdsInstances';
import { environmentDao } from '../dao/mycrt-dao';
import { HttpError } from '../http-error';
import * as check from '../middleware/request-validation';
import * as schema from '../request-schema/validate-schema';
import SelfAwareRouter from './self-aware-router';

const logger = Logging.defaultLogger(__dirname);

export default class ValidateRouter extends SelfAwareRouter {

   public name: string = 'validate';
   public urlPrefix: string = '/validate';

   private logger = Logging.defaultLogger(__dirname);

   constructor(ipcNode: ServerIpcNode) {
      super(ipcNode, [
         session.loggedInOrForbidden,
      ]);
   }

   protected mountRoutes(): void {

      this.router.post('/credentials/name', check.validBody(schema.credentialsNameBody),
            this.handleHttpErrors(async (request, response) => {

         const keysWithSameName = await environmentDao.getAllAwsKeysByName(request.body.keysName, request.user!);
         if (keysWithSameName !== null) {
            throw new HttpError(http.BAD_REQUEST, "Keys with same name already exists");
         } else {
            response.json({status: http.OK}).end();
         }
      }));

      this.router.post('/credentials', check.validBody(schema.credentialsBody),
            this.handleHttpErrors(async (request, response) => {

         if (request.body.keysName) {
            const keysWithSameName = await environmentDao.getAllAwsKeysByName(request.body.keysName, request.user!);
            if (keysWithSameName !== null) {
               throw new HttpError(http.BAD_REQUEST, "Keys with same name already exists");
            }
         }

         const rds = new RDS({
            region: request.body.region,
            accessKeyId: request.body.accessKey,
            secretAccessKey: request.body.secretKey,
         });

         const instances = await getDbInstances(rds, {});
         response.json(instances);
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
            response.json({status: http.OK}).end();
         } catch (e) {
            throw new HttpError(http.BAD_REQUEST, "Can't connect to the database");
         }
      }));

      this.router.get('/bucket',
         check.validQuery(schema.bucketQuery),
         this.handleHttpErrors(makeSureUserIsEnvironmentMember((req) => req.query.envId)),
         this.handleHttpErrors(async (request, response) => {
            const envId = request.query.envId;
            const environment = await environmentDao.getEnvironmentFull(envId);
            if (!environment) {
               throw new HttpError(http.BAD_REQUEST, `Environment ${envId} does not exist`);
            }
            const storage = new S3Backend(
               new S3({region: environment.region,
                  accessKeyId: environment.accessKey,
                  secretAccessKey: environment.secretKey}),
                  environment.bucket, environment.prefix,
            );

            const bucketExists = await storage.bucketExists();
            if (!bucketExists) {
               throw new HttpError(http.BAD_REQUEST, `S3 Bucket ${environment.bucket} does not exist`);
            }
            response.json(environment.bucket);
         },
      ));

      this.router.get('/bucket/metrics',
         check.validQuery(schema.bucketMetricsQuery),
         this.handleHttpErrors(makeSureUserIsEnvironmentMember((req) => req.query.envId)),
         this.handleHttpErrors(async (request, response) => {
            const envId = request.query.envId;
            const id = request.query.id;
            const type = request.query.type;

            const environment = await environmentDao.getEnvironmentFull(envId);
            if (!environment) {
               throw new HttpError(http.BAD_REQUEST, `Environment ${envId} does not exist`);
            }
            const storage = new S3Backend(
               new S3({region: environment.region,
                  accessKeyId: environment.accessKey,
                  secretAccessKey: environment.secretKey}),
                  environment.bucket, environment.prefix,
            );

            const key = `environment${envId}/${type}${id}/metrics.json`;
            const metricsExist = await storage.exists(key);
            if (!metricsExist) {
               throw new HttpError(http.BAD_REQUEST, `Associated metrics file does not exist`);
            }
            response.json(environment.bucket);
         },
      ));

      this.router.get('/bucket/workload',
         check.validQuery(schema.bucketWorkloadQuery),
         this.handleHttpErrors(makeSureUserIsEnvironmentMember((req) => req.query.envId)),
         this.handleHttpErrors(async (request, response) => {
            const envId = request.query.envId;
            const id = request.query.id;

            const environment = await environmentDao.getEnvironmentFull(envId);
            if (!environment) {
               throw new HttpError(http.BAD_REQUEST, `Environment ${envId} does not exist`);
            }
            const storage = new S3Backend(
               new S3({region: environment.region,
                  accessKeyId: environment.accessKey,
                  secretAccessKey: environment.secretKey}),
                  environment.bucket, environment.prefix,
            );

            const key = `environment${envId}/capture${id}/workload.json`;
            const workloadExists = await storage.exists(key);
            if (!workloadExists) {
               throw new HttpError(http.BAD_REQUEST, `Associated workload.json file does not exist`);
            }
            response.json(environment.bucket);
         },
      ));

      this.router.post('/bucket', check.validBody(schema.credentialsBody),
         this.handleHttpErrors(async (request, response) => {
         const s3 = new S3({
            region: request.body.region,
            accessKeyId: request.body.accessKey,
            secretAccessKey: request.body.secretKey,
         });

         try {
            const data = await this.getBuckets(s3, {});
            const buckets: any = [];
            data.Buckets.forEach((bucket: S3.Bucket) => {
               buckets.push(bucket.Name);
            });
            response.json(buckets);
         } catch (e) {
            throw new HttpError(http.BAD_REQUEST, "Credentials are invalid");
         }
      }));

      this.router.post('/environmentName',
         check.validBody(schema.environmentNameBody),
         this.handleHttpErrors(async (request, response) => {
            const environment = await environmentDao.getEnvironmentByName(request.body.name);
            const result: Check = {
               value: environment === null,
            };
            response.json(result);
         },
      ));

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
