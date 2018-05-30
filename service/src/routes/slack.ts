import * as http from 'http-status-codes';

import { Logging, ServerIpcNode, SlackBot } from '@lbt-mycrt/common';

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

      this.router.get('/:id(\\d+)/slack', this.handleHttpErrors(async (request, response) => {
         const environment = await environmentDao.getEnvironment(request.params.id);
         if (!environment) {
            throw new HttpError(http.NOT_FOUND, `Environment ${request.params.id} does not exist`);
         }

         const isUserMember = await inviteDao.getUserMembership(request.user!, environment!);
         if (!isUserMember.isMember) {
            throw new HttpError(http.UNAUTHORIZED);
         }

         const slack = await environmentDao.getSlackConfigByEnv(request.params.id);
         if (!slack) {
            throw new HttpError(http.NOT_FOUND);
         }
         response.json(slack);
      }));

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
         SlackBot.postMessage("Heyo it's lil Bobby bot, nice to meet you! " +
            "Imma let you know what goes down with your captures and replays", environment.id!);
         response.json(slack);
      }));

      this.router.put('/:id(\\d+)/slack', check.validBody(schema.slackPutBody),
            this.handleHttpErrors(async (request, response) => {

         const environment = await environmentDao.getEnvironment(request.params.id);
         if (!environment) {
            throw new HttpError(http.NOT_FOUND, `Environment ${request.params.id} does not exist`);
         }

         const isUserMember = await inviteDao.getUserMembership(request.user!, environment!);
         if (!isUserMember.isAdmin) {
            throw new HttpError(http.UNAUTHORIZED);
         }

         const slackPut = await environmentDao.editSlackConfig(request.params.id, request.body);
         response.status(http.OK).end();
      }));

      this.router.delete('/:id(\\d+)/slack', this.handleHttpErrors(async (request, response) => {
         const environment = await environmentDao.getEnvironment(request.params.id);
         if (!environment) {
            throw new HttpError(http.NOT_FOUND);
         }

         const isUserMember = await inviteDao.getUserMembership(request.user!, environment!);
         if (!isUserMember.isAdmin) {
            throw new HttpError(http.UNAUTHORIZED);
         }

         const slack = await environmentDao.getSlackConfigByEnv(request.params.id);
         if (!slack) {
            throw new HttpError(http.NOT_FOUND);
         }

         const slackDel = await environmentDao.deleteSlackConfig(slack.id!);
         response.status(http.OK).end();
      }));
   }
}
