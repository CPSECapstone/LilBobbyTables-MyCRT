import * as crypto from 'crypto';
import { NextFunction, Request, Response } from 'express';
import * as http from 'http-status-codes';

import { ISession, IUser, Logging } from '@lbt-mycrt/common';

import { sessionDao } from '../dao/mycrt-dao';
import { settings } from '../settings';

const logger = Logging.defaultLogger(__dirname);

/** Session Configuration */

const sessionTokenName: string = settings.sessionTokenName || "MyCRTAuthToken";
const sessionDuration: number = ((): number => {
   const setting = settings.sessionDuration;
   if (typeof setting === 'number' && setting > 0) {
      return setting;
   }
   return 7200000;
})();

export async function createActiveSession(user: IUser, response?: Response): Promise<string | null> {

   if (!user.id) {
      throw new Error("Cannot create an active session without a user id");
   }

   logger.info(`Creating new session for user ${user.id}`);
   const newToken = crypto.randomBytes(32).toString('hex');
   logger.info(`  ${sessionTokenName}: ${newToken}`);

   await sessionDao.beginSession(user, newToken);

   if (response) {
      response.cookie(sessionTokenName, newToken, {
         maxAge: sessionDuration,
         httpOnly: true,
      });
   }

   return newToken;

}

export function getSessionToken(request: Request): string | null | undefined {
   return request.cookies && request.cookies[sessionTokenName];
}

/** Middlewares */

export async function sessionMiddleware(request: Request, response: Response, next: NextFunction) {
   const token = getSessionToken(request);

   if (token) {
      const user: IUser | null = await sessionDao.getUserWithToken(token);
      if (user) {
         const now = new Date().getTime();
         const expired = !user.lastTokenCheck || user.lastTokenCheck! < now - sessionDuration;
         if (expired) {
            logger.info(`Session ${token} for user ${user.email} is not valid`);
            await sessionDao.clearSession(user);
         } else {
            logger.info(`Found session for user ${user.email}`);
            const session: ISession | null = await sessionDao.updateSession(user);
            if (!session) {
               logger.warn(`Could not update the session`);
            }
            request.user = (await sessionDao.getUserWithToken(token))!;
         }
      } else {
         logger.info(`Unknown session token`);
      }
   }

   next();
}

declare type Gatekeeper = (resonse: Response, admin: boolean) => void;

const forbidGatekeeper: Gatekeeper = (response: Response, admin: boolean) => {
   response.status(http.FORBIDDEN).json({
      code: http.FORBIDDEN,
      message: admin ? 'admin login required' : 'login required',
   });
};

const redirectGatekeeper: Gatekeeper = (response: Response) => {
   response.redirect(http.TEMPORARY_REDIRECT, '/login');
};

const getLoggedInMiddleware = (admin: boolean, redirect: boolean) =>
      (request: Request, response: Response, next: NextFunction) => {
   const gatekeeper: Gatekeeper = redirect ? redirectGatekeeper : forbidGatekeeper;
   const resource = request.originalUrl;
   if (!request.user) {
      logger.warn(`Session required for resource ${resource} (admin needed? ${admin}`);
      gatekeeper(response, admin);
   } else if (admin && !request.user.isAdmin) {
      logger.warn(`Admin session required for resource ${resource}`);
      gatekeeper(response, admin);
   } else {
      logger.info(`Granted permission to ${request.user.email} for resource ${resource}`);
      next();
   }
};

export const adminLoggedIn = getLoggedInMiddleware(true, true);
export const loggedIn = getLoggedInMiddleware(false, true);
export const adminLoggedInOrForbidden = getLoggedInMiddleware(true, false);
export const loggedInOrForbidden = getLoggedInMiddleware(false, false);
