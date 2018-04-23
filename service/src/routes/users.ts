import * as http from 'http-status-codes';

import { IUser, Logging } from '@lbt-mycrt/common';

import * as session from '../auth/session';
import { userDao } from '../dao/mycrt-dao';
import { HttpError } from '../http-error';
import * as check from '../middleware/request-validation';
import * as schema from '../request-schema/user-schema';
import SelfAwareRouter from './self-aware-router';

const logger = Logging.defaultLogger(__dirname);

export class UserRouter extends SelfAwareRouter {

   public name: string = 'user';
   public urlPrefix: string = '/users';

   protected mountRoutes(): void {

      this.router.get('/',
         session.adminLoggedIn,
         this.handleHttpErrors(async (request, response) => {
            const users = await userDao.getAllUsers();
            response.json(users);
         },
      ));

      this.router.get('/me',
         session.loggedIn,
         this.handleHttpErrors(async (request, response) => {
            response.json(request.session!.user);
         },
      ));

      this.router.post('/login',
         check.validBody(schema.loginBody),
         this.handleHttpErrors(async (request, response) => {

            const user = await this.getUser(request.body.id);

            const sessionInfo = session.createActiveSession(user, response);
            response.json(user);

         },
      ));

      this.router.put('/logout',
         session.loggedIn,
         this.handleHttpErrors(async (request, response) => {
            session.clearSession(request, response);
            response.status(http.OK).end();
         }),
      );

      this.router.post('/signup', this.handleHttpErrors(async (request, response) => {

         let user: IUser | null = {
            isAdmin: false,
         };
         user = await userDao.makeUser(user);
         response.json(user);

      }));

      this.router.delete('/:id(\\d+)', this.handleHttpErrors(async (request, response) => {
         const user = userDao.deleteUser(request.params.id);
         if (user === null) {
            throw new HttpError(http.NOT_FOUND);
         }
         response.json(user);
      }));

   }

   private async getUser(id: number): Promise<IUser> {
      logger.info(`Getting user ${id}`);
      const user = await userDao.getUser(id);
      if (user === null) {
         logger.warn(`User not found`);
         throw new HttpError(http.FORBIDDEN);
      }
      return user;
   }

}
