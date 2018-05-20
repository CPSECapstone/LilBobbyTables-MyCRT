import * as http from 'http-status-codes';

import { Logging, ServerIpcNode } from '@lbt-mycrt/common';

import * as session from '../auth/session';
import { environmentDao, environmentInviteDao as inviteDao } from '../dao/mycrt-dao';
import { HttpError } from '../http-error';
import * as check from '../middleware/request-validation';
import * as schema from '../request-schema/common-schema';
import SelfAwareRouter from './self-aware-router';

export default class EnvUserRouter extends SelfAwareRouter {
   public name: string = 'envUser';
   public urlPrefix: string = '/envUsers';

   constructor(ipcNode: ServerIpcNode) {
      super(ipcNode, [
         session.loggedInOrForbidden,
      ]);
   }

   protected mountRoutes(): void {
      const logger = Logging.defaultLogger(__dirname);

      this.router.get('/:id(\\d+)', this.handleHttpErrors(async (request, response) => {
         const environment = await environmentDao.getEnvironment(request.params.id);
         if (!environment) {
            throw new HttpError(http.NOT_FOUND);
         }

         const isUserMember = await inviteDao.getUserMembership(request.user!, environment!);
         if (isUserMember.isMember) {
            const envUserCount = await inviteDao.getEnvUserCount(environment);
            response.json(envUserCount);
         } else {
            throw new HttpError(http.UNAUTHORIZED);
         }
      }));

      this.router.get('/:id(\\d+)/list', this.handleHttpErrors(async (request, response) => {
         const environment = await environmentDao.getEnvironment(request.params.id);
         if (!environment) {
            throw new HttpError(http.NOT_FOUND);
         }

         const isUserMember = await inviteDao.getUserMembership(request.user!, environment!);
         if (isUserMember.isAdmin) {
            const envUsers = await inviteDao.getEnvUsers(environment);
            response.json(envUsers);
         } else {
            throw new HttpError(http.UNAUTHORIZED);
         }

      }));

      this.router.get('/:id(\\d+)/me', this.handleHttpErrors(async (request, response) => {
         const environment = await environmentDao.getEnvironment(request.params.id);
         if (!environment) {
            throw new HttpError(http.NOT_FOUND);
         }

         const isUserMember = await inviteDao.getUserMembership(request.user!, environment!);
         response.json(isUserMember);
      }));
   }
}
