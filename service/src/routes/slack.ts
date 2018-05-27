import * as http from 'http-status-codes';

import { Logging, ServerIpcNode } from '@lbt-mycrt/common';

import * as session from '../auth/session';
import { environmentDao, environmentInviteDao as inviteDao } from '../dao/mycrt-dao';
import { HttpError } from '../http-error';
import * as check from '../middleware/request-validation';
import * as schema from '../request-schema/slack-schema';
import SelfAwareRouter from './self-aware-router';

export default class SlackRouter extends SelfAwareRouter {
   public name: string = 'slack';
   public urlPrefix: string = '';

   constructor(ipcNode: ServerIpcNode) {
      super(ipcNode, [
         session.loggedInOrForbidden,
      ]);
   }

   protected mountRoutes(): void {
      const logger = Logging.defaultLogger(__dirname);

      this.router.post('/:id(\\d+)/slack', check.validBody(schema.slackBody),
            this.handleHttpErrors(async (request, response) => {

         const environment = await environmentDao.getEnvironment(request.params.id);
         if (!environment) {
            throw new HttpError(http.NOT_FOUND, `Environment ${request.params.id} does not exist`);
         }

         const isUserMember = await inviteDao.getUserMembership(request.user!, environment!);
         if (!isUserMember.isAdmin) {
            throw new HttpError(http.UNAUTHORIZED);
         }

         const slackWithEnv = await environmentDao.getSlackConfigByEnv(request.params.id);
         if (slackWithEnv !== null) {
            throw new HttpError(http.BAD_REQUEST, "Environment already is configured with slack");
         }

         const slackConfig = {
            channel: request.body.channel,
            token: request.body.token,
            environmentId: request.params.id,
         };

         const slack = await environmentDao.makeSlackConfig(slackConfig);
         response.json(slack);
      }));
   }
}
