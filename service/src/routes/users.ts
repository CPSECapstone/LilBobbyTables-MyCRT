import * as http from 'http-status-codes';

import { IUser, Logging } from '@lbt-mycrt/common';

import * as auth from '../auth';
import * as session from '../auth/session';
import { sessionDao, userDao } from '../dao/mycrt-dao';
import { HttpError } from '../http-error';
import * as check from '../middleware/request-validation';
import * as schema from '../request-schema/user-schema';
import SelfAwareRouter from './self-aware-router';

const logger = Logging.defaultLogger(__dirname);

export class UserRouter extends SelfAwareRouter {

   public name: string = 'user';
   public urlPrefix: string = '/users';

   private MS_PER_HOUR: number = 1000 * 60 * 60;

   protected mountRoutes(): void {

      this.router.get('/',
         session.adminLoggedInOrForbidden,
         this.handleHttpErrors(async (request, response) => {
            const users = await userDao.getAllUsers();
            response.json(users);
         },
      ));

      this.router.get('/me',
         session.loggedInOrForbidden,
         this.handleHttpErrors(async (request, response) => {
            const user = request.user;
            response.json({
               id: user!.id,
               isAdmin: user!.isAdmin,
               email: user!.email,
            });
         },
      ));

      this.router.post('/login',
         check.validBody(schema.loginBody),
         this.handleHttpErrors(async (request, response) => {
            const user = await this.getUser(request.body.email, true);
            const pass: boolean = await auth.compareHash(request.body.password, user.passwordHash!);
            if (!pass) {
               throw new HttpError(http.FORBIDDEN, "Invalid Password");
            }
            const responseUser: IUser = {
               id: user.id,
               email: user.email,
               isAdmin: user.isAdmin,
            };
            try {
               const sessionInfo = await session.createActiveSession(responseUser, response);
            } catch (e) {
               logger.error("Failed to make session");
               logger.error(JSON.stringify(e));
               throw new HttpError(http.INTERNAL_SERVER_ERROR);
            }
            response.json(responseUser);
         },
      ));

      this.router.put('/logout',
         session.loggedInOrForbidden,
         this.handleHttpErrors(async (request, response) => {
            await sessionDao.clearSession(request.user!);
            response.json({});
         }),
      );

      this.router.post('/signup',
         check.validBody(schema.signupBody),
         this.handleHttpErrors(async (request, response) => {

            if (!request.body.agreeToTerms) {
               throw new HttpError(http.BAD_REQUEST, "You must accept the terms of use.");
            }

            const passwordHash: string = await auth.encrypt(request.body.password);

            let user: IUser | null = {
               isAdmin: false,
               email: request.body.email,
               passwordHash,
            };

            try {
               user = await userDao.makeUser(user);
            } catch (e) {
               logger.error(JSON.stringify(e));
               if (e.code && e.code === 'ER_DUP_ENTRY') {
                  throw new HttpError(http.BAD_REQUEST,
                     "An account with that email address already exists");
               }
            }
            response.json(user);

         },
      ));

      this.router.post('/forgotPassword', check.validBody(schema.forgotPasswordBody),
         this.handleHttpErrors(async (request, response) => {

            const user = await userDao.getUser(request.body.email);

            if (!user) {
               // Send email saying they don't exist in database
               response.sendStatus(http.OK).json("An email will be sent to the provided address");
            }

            logger.info(`got here!`);
            const token = await userDao.getPasswordResetToken(user!.id!);
            // TODO: implement send email instead of returning token
            response.status(http.OK).json(token);
         },
      ));

      this.router.put('/resetPassword', check.validBody(schema.resetPasswordBody),
         this.handleHttpErrors(async (request, response) => {

            const now = Date.now();
            const user = await userDao.getUserByResetToken(request.body.resetToken);
            const newPassHash = await auth.encrypt(request.body.newPassword);
            const newPassHashMatch = await auth.compareHash(request.body.newPasswordAgain, newPassHash);

            if (!user) {
               throw new HttpError(http.BAD_REQUEST, "This password reset token does not exist");
            }

            if (user.resetUsedAt) {
               throw new HttpError(http.CONFLICT, "Password reset token has already been used");
            }

            if (user.resetCreatedAt && (now - user.resetCreatedAt < this.MS_PER_HOUR)) {

               if (!newPassHashMatch) {
                  throw new HttpError(http.BAD_REQUEST, "New passwords do not match");
               }

               await userDao.updateUserPassword(user.email!, newPassHash, true);
               response.status(http.OK).json("Password reset. Please try logging in");

            } else {
               throw new HttpError(http.BAD_REQUEST, "This password reset token has expired");
            }

         },
      ));

      this.router.put('/changePassword', session.loggedInOrForbidden,
         check.validBody(schema.newPasswordBody),
         this.handleHttpErrors(async (request, response) => {

            const user = request.user!;

            const oldPassMatch = await auth.compareHash(request.body.oldPassword, user.passwordHash!);
            const newPassHash = await auth.encrypt(request.body.newPassword);
            const newPassHashMatch = await auth.compareHash(request.body.newPasswordAgain, newPassHash);

            if (!oldPassMatch) {
               throw new HttpError(http.BAD_REQUEST, "Old password does not match your current password");
            }

            if (!newPassHashMatch) {
               throw new HttpError(http.BAD_REQUEST, "New passwords do not match");
            }

            await userDao.updateUserPassword(user.id!, newPassHash);
            response.json(user);

      }));

      this.router.delete('/:id(\\d+)',
         session.adminLoggedInOrForbidden,
         this.handleHttpErrors(async (request, response) => {
            const user = userDao.deleteUser(request.params.id);
            if (user === null) {
               throw new HttpError(http.NOT_FOUND);
            }
            response.json(user);
         },
      ));

   }

   private async getUser(id: number | string, includePasswordHash?: boolean): Promise<IUser> {
      logger.info(`Getting user ${id}`);
      const user = await userDao.getUser(id, includePasswordHash);
      if (user === null) {
         logger.warn(`User not found`);
         throw new HttpError(http.FORBIDDEN, "User not found");
      }
      return user;
   }

}
