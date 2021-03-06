import * as http from 'http-status-codes';

import { Logging, ServerIpcNode } from '@lbt-mycrt/common';

import * as session from '../auth/session';
import { environmentDao } from '../dao/mycrt-dao';
import { HttpError } from '../http-error';
import * as check from '../middleware/request-validation';
import * as schema from '../request-schema/common-schema';
import SelfAwareRouter from './self-aware-router';

export default class DBReferenceRouter extends SelfAwareRouter {
   public name: string = 'dbReference';
   public urlPrefix: string = '/dbReferences';

   constructor(ipcNode: ServerIpcNode) {
      super(ipcNode, [
         session.loggedInOrForbidden,
      ]);
   }

   protected mountRoutes(): void {
      const logger = Logging.defaultLogger(__dirname);

      this.router.get('/:id(\\d+)', check.validParams(schema.idParams),
            this.handleHttpErrors(async (request, response) => {

         const dbId = request.params.id;
         const dbRef = await environmentDao.getDbReference(dbId);
         if (!dbRef) {
            throw new HttpError(http.NOT_FOUND);
         }
         response.json(dbRef);
      }));
   }
}
