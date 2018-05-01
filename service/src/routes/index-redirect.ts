import { Request, Response } from 'express';
import * as http from 'http-status-codes';

import { Logging } from '@lbt-mycrt/common';
import { Pages } from '@lbt-mycrt/gui';

import { environmentInviteDao as inviteDao } from '../dao/mycrt-dao';

const logger = Logging.defaultLogger(__dirname);

export const indexRouteHandler = async (request: Request, response: Response) => {

   const environments = await inviteDao.getAllEnvironmentsWithMembership(request.user!);
   const doRedirect = environments.length > 0;

   if (doRedirect) {
      logger.info(`Found some environments, redirecting to dashboard`);
      response.redirect(http.MOVED_TEMPORARILY, '/environments');
   } else {
      logger.info(`No environemnts found, showing index`);
      response.send(Pages.index.getText()).end();
   }

};
