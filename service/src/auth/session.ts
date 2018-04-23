import * as crypto from 'crypto';
import { NextFunction, Request, Response } from 'express';
import * as http from 'http-status-codes';

import { IUser, Logging } from '@lbt-mycrt/common';

import { settings } from '../settings';

const logger = Logging.defaultLogger(__dirname);

/** Session Configutation */

const sessionTokenName: string = settings.sessionTokenName || "MyCRTAuthToken";
const sessionDuration: number = ((): number => {
   const setting = settings.sessionDuration;
   if (typeof setting  === 'number' && setting > 0) {
      return setting;
   }
   return 7200000;
})();

/** Store sessions here */

const sessions: {[key: string]: Session | undefined} = {};

/** Manage a user's session */

export interface ISession {
   user: IUser;
   loginTime: number;
   lastUsed: number;
}

export function createActiveSession(user: IUser, response?: Response): [string, ISession] {

   if (!user.id) {
      throw new Error("Cannot create an active session without a user id");
   }

   for (const token in sessions) {
      if (sessions[token] && sessions[token]!.user.id === user.id) {
         sessions[token] = undefined;
      }
   }

   logger.info(`Creating new session for user ${user.id}`);
   const session = new Session(user);
   const newToken = crypto.randomBytes(32).toString('hex');
   logger.info(`  ${sessionTokenName}: ${newToken}`);
   sessions[newToken] = session;

   if (response) {
      response.cookie(sessionTokenName, newToken, {
         maxAge: sessionDuration,
         httpOnly: true,
      });
   }

   return [newToken, session.snapshot()];
}

export function getSessionToken(request: Request): string | null {
   return request.cookies && request.cookies[sessionTokenName];
}

export function clearSession(request: Request, response: Response) {
   const token = getSessionToken(request);
   logger.info(`Clearing session "${token}"`);
   if (token) {
      sessions[token] = undefined;
   }
   request.session = undefined;
   // request.clearCookie(sessionTokenName);
   // response.clearCookie(sessionTokenName);
}

export class Session {

   /** A middleware to manage the session */
   public static sessionMiddleware = function(request: Request, response: Response, next: NextFunction) {
      const token = getSessionToken(request);
      if (token) {
         const thisSession = sessions[token];
         if (thisSession) {
            const now = new Date().getTime();
            if (thisSession.lastUsed < now - sessionDuration) {
               logger.info(`Session for user ${thisSession.user.id} expired`);
               sessions[token] = undefined;
            } else {
               logger.info(`Found session for user ${thisSession.user.id}`);
               thisSession.lastUsed = now;
               request.session = thisSession.snapshot();
            }
         } else {
            logger.info(`Unknown token, removing session`);
            clearSession(request, response);
         }
      }
      next();
   };

   /** A middleware to enforce that users are logged in */
   public static getLoggedInMiddleware = (admin: boolean = false) =>
         (request: Request, response: Response, next: NextFunction) => {
      const resource = request.url;
      if (!request.session) {
         logger.warn(`Session required for resource ${resource} (admin needed? ${admin})`);
         response.status(http.FORBIDDEN).end();
      } else if (admin && !request.session.user.isAdmin) {
         logger.warn(`Admin session required for resource ${resource}`);
         response.status(http.FORBIDDEN).end();
      } else {
         logger.info(`Granted permission to user ${request.session.user.id} `
            + `for resource ${resource}`);
         next();
      }
   }

   private loginTime: number;
   private lastUsed: number;

   constructor(public readonly user: IUser) {
      const now = new Date().getTime();
      this.loginTime = now;
      this.lastUsed = now;
   }

   public snapshot(): ISession {
      return {
         user: this.user,
         loginTime: this.loginTime,
         lastUsed: this.lastUsed,
      };
   }

}

export const adminLoggedIn = Session.getLoggedInMiddleware(true);
export const loggedIn = Session.getLoggedInMiddleware(false);