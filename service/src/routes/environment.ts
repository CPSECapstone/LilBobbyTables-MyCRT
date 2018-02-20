import * as http from 'http-status-codes';

import { Logging } from '@lbt-mycrt/common';
import * as data from '@lbt-mycrt/common/dist/data';

import { environmentDao } from '../dao/mycrt-dao';
import { HttpError } from '../http-error';
import * as check from '../middleware/request-validation';
import * as schema from '../request-schema/environment-schema';
import SelfAwareRouter from './self-aware-router';

export default class EnvironmentRouter extends SelfAwareRouter {
   public name: string = 'environment';
   public urlPrefix: string = '/environments';

   protected mountRoutes(): void {
      const logger = Logging.defaultLogger(__dirname);

      this.router.get('/', this.handleHttpErrors(async (request, response) => {

         const environments = await environmentDao.getAllEnvironments();
         response.json(environments);

      }));

      this.router.get('/:id(\\d+)', check.validParams(schema.idParams),
            this.handleHttpErrors(async (request, response) => {

         const id = request.params.id;
         const environment = await environmentDao.getEnvironment(id);
         if (!environment) {
            throw new HttpError(http.NOT_FOUND);
         }
         response.json(environment);

      }));

      this.router.post('/', check.validBody(schema.environmentBody),
            this.handleHttpErrors(async (request, response) => {

         let iamReference: data.IIamReference = {
            accessKey: request.body.accessKey,
            secretKey: request.body.secretKey,
            region: request.body.region,
         };
         let s3Reference: data.IS3Reference = {
            bucket: request.body.bucket,
         };
         let dbReference: data.IDbReference = {
            name: request.body.dbName,
            host: request.body.host,
            user: request.body.user,
            pass: request.body.pass,
            instance: request.body.instance,
            parameterGroup: request.body.parameterGroup,
         };

         iamReference = await environmentDao.makeIamReference(iamReference);
         s3Reference = await environmentDao.makeS3Reference(s3Reference);
         dbReference = await environmentDao.makeDbReference(dbReference);

         let environment: data.IEnvironment | null = {
            name: request.body.envName,
            iamId: iamReference.id!,
            s3Id: s3Reference.id!,
            dbId: dbReference.id!,
         };

         environment = await environmentDao.makeEnvironment(environment);
         response.json(environment!);

      }));

      // TODO: Figure out exactly what is allowed to be edited.
      this.router.put('/:id(\\d+)', check.validBody(schema.environmentBody),
            this.handleHttpErrors(async (request, response) => {

         const id = request.params.id;

         let environment: data.IEnvironment | null = {
            name: request.body.envName,
         };

         environment = await environmentDao.editEnvironment(id, environment);
         response.json(environment!);

      }));

      this.router.delete('/:id(\\d+)', check.validParams(schema.idParams),
            this.handleHttpErrors(async (request, response) => {

         const id = request.params.id;
         const environment = await environmentDao.deleteEnvironment(id);
         if (!environment) {
            throw new HttpError(http.NOT_FOUND);
         }
         response.json(environment);

      }));
   }
}
