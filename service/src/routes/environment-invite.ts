import * as http from 'http-status-codes';

import { Logging, ServerIpcNode } from '@lbt-mycrt/common';

import * as session from '../auth/session';
import { environmentDao, environmentInviteDao as inviteDao, userDao } from '../dao/mycrt-dao';
import { HttpError } from '../http-error';
import * as check from '../middleware/request-validation';
import * as schema from '../request-schema/environment-invite-schema';
import SelfAwareRouter from './self-aware-router';

const logger = Logging.defaultLogger(__dirname);

export default class EnvironmentInviteRouter extends SelfAwareRouter {
   public name: string = 'environmentInvite';
   public urlPrefix: string = '/invites';

   constructor(ipcNode: ServerIpcNode) {
      super(ipcNode, [
         session.loggedInOrForbidden,
      ]);
   }

   protected mountRoutes(): void {

      this.router.post('/',
         check.validBody(schema.inviteBody),
         this.handleHttpErrors(async (request, response) => {

            // find the environment
            logger.info("Getting the environment");
            const environmentId = request.body.environmentId;
            const environment = await environmentDao.getEnvironment(environmentId);
            if (!environment) {
               throw new HttpError(http.NOT_FOUND, `Environment ${environmentId} does not exist`);
            }

            // user must be an administrator
            logger.info("Checking if user can invite others");
            const membership = await inviteDao.getUserMembership(request.user!, environment);
            if (!membership.isMember) {
               throw new HttpError(http.NOT_FOUND, `Environment ${environmentId} does not exist`);
            } else if (!membership.isAdmin) {
               throw new HttpError(http.FORBIDDEN, `Only environment administrators can invite`);
            }

            // find the user to invite
            logger.info("Getting the user to invite");
            const user = await userDao.getUser(request.body.userEmail);
            if (!user) {
               throw new HttpError(http.BAD_REQUEST,
                  `User ${request.body.userEmail} does not exist`);
            }

            // good to go!
            logger.info("Creating invite");
            const invite = await inviteDao.inviteUser(environment, user, request.body.isAdmin);

            logger.info("Invite created!");
            response.json(invite);
         },
      ));

      this.router.delete('/:id(\\d+)', check.validParams(schema.idParams),
            this.handleHttpErrors(async (request, response) => {

         const userInvite = await inviteDao.getInvite(request.params.id);
         if (!userInvite) {
            throw new HttpError(http.NOT_FOUND);
         }

         if (userInvite.userId !== request.user!.id) {
            throw new HttpError(http.UNAUTHORIZED);
         }

         const inviteDel = await inviteDao.delInvite(request.params.id);
         response.json(inviteDel);
      }));

      this.router.put('/accept',
         check.validBody(schema.acceptBody),
         this.handleHttpErrors(async (request, response) => {

            // get the invitation
            logger.info("Getting the invitation");
            const invite = await inviteDao.getInviteByCode(request.body.inviteCode);

            // make sure it exists and belongs to the user
            logger.info(`Making sure it belongs to ${request.user!.email}`);
            if (!invite || invite.userId !== request.user!.id) {
               throw new HttpError(http.NOT_FOUND);
            }

            // check if it has already been accepted
            logger.info("Checking if the invite has already been accepted");
            if (invite.accepted) {
               throw new HttpError(http.CONFLICT, "Invite has already been accepted");
            }

            // accept it!
            logger.info("Accepting invitation");
            try {
               await inviteDao.acceptInvite(invite);
            } catch (e) {
               throw new HttpError(http.CONFLICT, "Invitation has expired");
            }

            logger.info("Done");

            logger.info("Getting environment to return");
            const environment = await environmentDao.getEnvironmentFull(invite.environmentId!);
            response.json(environment);

         },
      ));
   }
}
