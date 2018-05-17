import { NextFunction, Request, Response } from 'express';
import * as http from 'http-status-codes';

import { environmentDao, environmentInviteDao as inviteDao} from '../dao/mycrt-dao';
import { HttpError } from '../http-error';

export const makeSureUserIsEnvironmentMember = async (request: Request, response: Response,
      next: NextFunction) => {

   const envId = request.query.envId;
   const environment = await environmentDao.getEnvironment(envId);
   if (!environment) {
      throw new HttpError(http.NOT_FOUND);
   }

   const membership = await inviteDao.getUserMembership(request.user!, environment);
   if (!membership.isMember) {
      throw new HttpError(http.NOT_FOUND);
   }

   next();

};
