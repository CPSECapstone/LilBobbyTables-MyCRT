import { RDS, S3 } from 'aws-sdk';

import * as http from 'http-status-codes';

import { IAwsKeys, Logging, ServerIpcNode } from '@lbt-mycrt/common';
import * as data from '@lbt-mycrt/common/dist/data';

import { S3Backend } from '@lbt-mycrt/common/dist/storage/s3-backend';

import { makeSureUserIsEnvironmentMember } from '../auth/middleware';
import * as session from '../auth/session';
import { getDbInstances } from '../common/rdsInstances';
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

            const environments = await inviteDao.getAllEnvironmentsWithMembership(request.user!);
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

         environment.accessKey = "";
         environment.secretKey = "";

         const membership = await inviteDao.getUserMembership(request.user!, environment);
         if (!membership.isMember) {
            throw new HttpError(http.UNAUTHORIZED);
         }
         response.json(environment);
      }));

      this.router.get('/:id(\\d+)/dbs',
         check.validParams(schema.idParams),
         this.handleHttpErrors(makeSureUserIsEnvironmentMember((req) => req.params.id)),
         this.handleHttpErrors(async (request, response) => {

            const envId: number = request.params.id;
            logger.info(`Getting environment ${envId}`);
            const environment = await environmentDao.getEnvironmentFull(envId);
            if (!environment) {
               logger.warn(`Environment not found`);
               throw new HttpError(http.NOT_FOUND);
            }

            const keys = await environmentDao.getAwsKeys(environment.keysId!);
            if (!keys) {
               logger.error(`There was a problem getting the environment keys`);
               throw new HttpError(http.INTERNAL_SERVER_ERROR);
            }

            // TODO
            const rds = new RDS({
               region: keys.region,
               accessKeyId: keys.accessKey,
               secretAccessKey: keys.secretKey,
            });

            const dbs = await getDbInstances(rds, {});
            response.json(dbs);

         }),
      );

      this.router.post('/', check.validBody(schema.environmentBody),
            this.handleHttpErrors(async (request, response) => {

         const envWithSameName = await environmentDao.getEnvironmentByName(request.body.envName);
         if (envWithSameName !== null) {
            throw new HttpError(http.BAD_REQUEST, "Environment with same name already exists");
         }

         let awsKeys: data.IAwsKeys;
         if (request.body.keysId) {
            const awsKeysOrNull = await environmentDao.getAwsKeys(request.body.keysId);
            if (!awsKeysOrNull) {
               throw new HttpError(http.NOT_FOUND, "Keys do not exist");
            } else {
               awsKeys = awsKeysOrNull;
               if (awsKeys.userId !== request.user!.id) {
                  throw new HttpError(http.FORBIDDEN, "Keys don't belong to user");
               }
            }
         } else {
            let newKeysName: string;
            if (request.body.keysName) {
               const keysWithSameName = await environmentDao.getAllAwsKeysByName(request.body.keysName, request.user!);
               if (keysWithSameName !== null) {
                  throw new HttpError(http.BAD_REQUEST, "Keys with same name already exists");
               }
               newKeysName = request.body.keysName;
            } else {
               newKeysName = "myKeys"; // autogenerate a name here
            }
            awsKeys = {
               accessKey: request.body.accessKey,
               secretKey: request.body.secretKey,
               region: request.body.region,
               userId: request.user!.id,
               name: newKeysName,
            };
            const awsKeysRow = await environmentDao.makeAwsKeys(awsKeys);
            if (awsKeysRow) {
               awsKeys = awsKeysRow;
            } else {
               throw new HttpError(http.INTERNAL_SERVER_ERROR, "Failed to store aws keys");
            }
         }
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
         environment.id = envId!.id;
         const userInvite = await inviteDao.inviteUser(environment, request.user!, true);
         const acceptInvite = await inviteDao.acceptInvite(userInvite!);
         response.json(envId);
      }));

      this.router.put('/:id(\\d+)', check.validBody(schema.environmentBody),
            this.handleHttpErrors(async (request, response) => {

         const environment = await environmentDao.getEnvironment(request.params.id);
         if (!environment) {
            throw new HttpError(http.NOT_FOUND, `Environment ${request.params.id} does not exist`);
         }

         const isUserMember = await inviteDao.getUserMembership(request.user!, environment!);
         if (!isUserMember.isAdmin) {
            throw new HttpError(http.UNAUTHORIZED);
         }

         const environmentEdits: data.IEnvironment | null = {
            name: request.body.envName,
         };

         const editEnvironment = await environmentDao.editEnvironment(request.params.id, environmentEdits);
         response.json(editEnvironment!);
      }));

      this.router.delete('/:id(\\d+)', check.validParams(schema.idParams),
            check.validQuery(schema.deleteLogsQuery),
            this.handleHttpErrors(async (request, response) => {

         const environment = await environmentDao.getEnvironment(request.params.id);
         if (!environment) {
            throw new HttpError(http.NOT_FOUND);
         }

         const isUserMember = await inviteDao.getUserMembership(request.user!, environment!);
         if (!isUserMember.isAdmin) {
            throw new HttpError(http.UNAUTHORIZED);
         }

         if (request.query.deleteLogs) {
            const env = await environmentDao.getEnvironmentFull(request.params.id);
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
         const environmentDel = await environmentDao.deleteEnvironment(request.params.id);
         response.json(environmentDel);
      }));

      const inviteRouter = new InviteRouter(this.ipcNode);
      this.router.use(inviteRouter.urlPrefix, inviteRouter.router);
   }
}
