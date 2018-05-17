import { NextFunction, Request, Response } from 'express';
import * as http from 'http-status-codes';

import { Logging } from '@lbt-mycrt/common';

import { environmentDao, environmentInviteDao as inviteDao} from '../dao/mycrt-dao';
import { HttpError } from '../http-error';

const logger = Logging.defaultLogger(__dirname);

export type EnvironmentIdGetter = (request: Request) => number;

export const makeSureUserIsEnvironmentMember = (envIdGetter: EnvironmentIdGetter) =>
      async (request: Request, response: Response, next: NextFunction) => {

   const envId = envIdGetter(request);
   const environment = await environmentDao.getEnvironment(envId);
   if (!environment) {
      logger.warn(`Environment ${request.query.envId} does not exist`);
      throw new HttpError(http.NOT_FOUND);
   }

   const membership = await inviteDao.getUserMembership(request.user!, environment);
   if (!membership.isMember && environment.ownerId !== request.user!.id) {
      logger.warn(`User ${request.user!.email} is not part of environment`);
      throw new HttpError(http.NOT_FOUND);
   }

   next();

};
