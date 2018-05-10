import { S3 } from 'aws-sdk';

import * as http from 'http-status-codes';

import { Logging, ServerIpcNode } from '@lbt-mycrt/common';
import * as data from '@lbt-mycrt/common/dist/data';

import { S3Backend } from '@lbt-mycrt/common/dist/storage/s3-backend';

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
         this.handleHttpErrors(async (request, response) => {

            let environments;
            environments = await inviteDao.getAllEnvironmentsWithMembership(request.user!);
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

         let awsKeys: data.IAwsKeys = {
            accessKey: request.body.accessKey,
            secretKey: request.body.secretKey,
            region: request.body.region,
            userId: request.user!.id,
            name: request.body.name || "mykeys", // TODO remove the || "mykeys"
         };
         let s3Reference: data.IS3Reference = {
            bucket: request.body.bucket,
            prefix: request.body.prefix,
         };
         let dbReference: data.IDbReference = {
            name: request.body.dbName,
            host: request.body.host,
            user: request.body.user,
            pass: request.body.pass,
            instance: request.body.instance,
            parameterGroup: request.body.parameterGroup,
         };

         const awsKeysRow = await environmentDao.makeAwsKeys(awsKeys);
         s3Reference = await environmentDao.makeS3Reference(s3Reference);
         const dbRef = await environmentDao.makeDbReference(dbReference);
         if (dbRef) {
            dbReference = dbRef;
         }
         if (awsKeysRow) {
            awsKeys = awsKeysRow;
         }

         const environment: data.IEnvironment = {
            name: request.body.envName,
            ownerId: request.user!.id,
            awsKeysId: awsKeys.id!,
            s3Id: s3Reference.id!,
            dbId: dbReference.id!,
         };

         const envId = await environmentDao.makeEnvironment(environment);
         environment.id = envId!.id;
         const userInvite = await inviteDao.inviteUser(environment, request.user!, true);
         const acceptInvite = await inviteDao.acceptInvite(userInvite!);
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

         if (deleteLogs === true) {
            const env = await environmentDao.getEnvironmentFull(id);
            if (env) {
               const storage = new S3Backend(
                  new S3({region: env.region,
                     accessKeyId: env.accessKey,
                     secretAccessKey: env.secretKey}),
                  env.bucket, env.prefix,
               );

               const envPrefix = `environment${env.id}/`;
               await storage.deletePrefix(envPrefix);
            }
         }

         const environment = await environmentDao.deleteEnvironment(id);
         if (!environment) {
            throw new HttpError(http.NOT_FOUND);
         }

         response.json(environment);

      }));

      // invites
      const inviteRouter = new InviteRouter(this.ipcNode);
      this.router.use(inviteRouter.urlPrefix, inviteRouter.router);
   }
}
