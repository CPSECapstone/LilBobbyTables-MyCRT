import { S3 } from 'aws-sdk';

import * as http from 'http-status-codes';

import { Logging, ServerIpcNode } from '@lbt-mycrt/common';
import * as data from '@lbt-mycrt/common/dist/data';

import * as session from '../auth/session';
import { environmentDao, environmentInviteDao as inviteDao } from '../dao/mycrt-dao';
import { HttpError } from '../http-error';
import * as check from '../middleware/request-validation';
import * as schema from '../request-schema/environment-schema';
import InviteRouter from './environment-invite';
import SelfAwareRouter from './self-aware-router';

export default class EnvironmentRouter extends SelfAwareRouter {
   public name: string = 'environment';
   public urlPrefix: string = '/environments';

   constructor(ipcNode: ServerIpcNode) {
      super(ipcNode, [
         session.loggedInOrForbidden,
      ]);
   }

   protected mountRoutes(): void {
      const logger = Logging.defaultLogger(__dirname);

      this.router.get('/',
         check.validQuery(schema.envNameQuery),
         this.handleHttpErrors(async (request, response) => {

            const envName = request.query.name;
            let environments;
            if (envName) {
               const env = await environmentDao.getEnvironmentByName(envName);
               if (!env) {
                  throw new HttpError(http.NOT_FOUND);
               }
               const membership = await inviteDao.getUserMembership(request.user!, env);
               if (!membership.isMember) {
                  throw new HttpError(http.NOT_FOUND);
               }
               environments = [env];
            } else {
               environments = await inviteDao.getAllEnvironmentsWithMembership(request.user!);
            }

            response.json(environments);
         },
      ));

      this.router.get('/:id(\\d+)', check.validParams(schema.idParams),
            this.handleHttpErrors(async (request, response) => {

         const id = request.params.id;
         logger.info(`Getting environment ${id}`);
         const environment = await environmentDao.getEnvironmentFull(id);
         if (!environment) {
            throw new HttpError(http.NOT_FOUND);
         }

         logger.info(`Getting membership for user ${request.user!.id}`);
         const membership = await inviteDao.getUserMembership(request.user!, environment);
         if (!membership.isMember) {
            logger.info(`User ${request.user!.id} is not a member of this environment`);
            throw new HttpError(http.NOT_FOUND);
         }

         response.json(environment);

      }));

      this.router.post('/', check.validBody(schema.environmentBody),
            this.handleHttpErrors(async (request, response) => {

         const envWithSameName = await environmentDao.getEnvironmentByName(request.body.envName);
         if (envWithSameName !== null) {
            throw new HttpError(http.BAD_REQUEST, "Environment with same name already exists");
         }

         logger.debug("I'm here");

         let awsKeys: data.IAwsKeys = {
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

         awsKeys = await environmentDao.makeAwsKeys(awsKeys);
         s3Reference = await environmentDao.makeS3Reference(s3Reference);
         const dbRef = await environmentDao.makeDbReference(dbReference);
         if (dbRef) {
            dbReference = dbRef;
         }

         const environment: data.IEnvironment = {
            name: request.body.envName,
            ownerId: request.user!.id,
            awsKeysId: awsKeys.id!,
            s3Id: s3Reference.id!,
            dbId: dbReference.id!,
         };

         const envId = await environmentDao.makeEnvironment(environment);
         response.json(envId);
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
            check.validQuery(schema.deleteLogsQuery),
            this.handleHttpErrors(async (request, response) => {

         const id = request.params.id;
         const deleteLogs: boolean | undefined = request.query.deleteLogs;

         const environment = await environmentDao.deleteEnvironment(id);
         if (!environment) {
            throw new HttpError(http.NOT_FOUND);
         }

         if (deleteLogs === true) {
            const env = await environmentDao.getEnvironmentFull(id);
            if (env) {
               // TODO: needs to be replaced by a S3StorageBackend object in the Capture Object
               const s3 = new S3(
                  {region: env.region, accessKeyId: env.accessKey, secretAccessKey: env.secretKey},
               );

               // TODO: Remove environment bucket from s3 (should just be s3.deleteBucket call)
               const s3Params = { Bucket: env.bucket };
               logger.info("Deleting environment bucket not implemented.");
            }
         }

         response.json(environment);

      }));

      // invites
      const inviteRouter = new InviteRouter(this.ipcNode);
      this.router.use(inviteRouter.urlPrefix, inviteRouter.router);
   }
}
