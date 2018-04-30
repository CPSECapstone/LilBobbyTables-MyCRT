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
         async (request, response) => {

            // find the environment
            const environmentId = request.body.environmentId;
            const environment = await environmentDao.getEnvironment(environmentId);
            if (!environment) {
               throw new HttpError(http.NOT_FOUND, `Environment ${environmentId} does not exist`);
            }

            // user must be an administrator
            const membership = await inviteDao.getUserMembership(request.user!, environment);
            if (!membership.isMember) {
               throw new HttpError(http.NOT_FOUND, `Environment ${environmentId} does not exist`);
            } else if (!membership.isAdmin) {
               throw new HttpError(http.FORBIDDEN, `Only environment administrators can invite`);
            }

            // good to go!
            const invite = await inviteDao.inviteUser(environment, request.user!);
            response.json(invite);
         },
      );

      this.router.put('/accept',
         check.validBody(schema.acceptBody),
         async (request, response) => {

            // get the invitation
            const invite = await inviteDao.getInviteByCode(request.body.inviteCode);

            // make sure it exists and belongs to the user
            if (!invite || invite.userId !== request.user!.id) {
               throw new HttpError(http.NOT_FOUND);
            }

            // accept it!
            try {
               await inviteDao.acceptInvite(invite);
            } catch (e) {
               throw new HttpError(http.CONFLICT, "Invitation has expired");
            }

            response.status(http.OK);

         },
      );

   }

}
