import * as http from 'http-status-codes';

import { Logging, ServerIpcNode } from "@lbt-mycrt/common";

import * as session from '../auth/session';
import { environmentDao } from '../dao/mycrt-dao';
import { HttpError } from "../http-error";
import * as check from '../middleware/request-validation';
import * as schema from '../request-schema/common-schema';
import SelfAwareRouter from "./self-aware-router";

export default class AwsKeysRouter extends SelfAwareRouter {
   public name: string = 'awsKeys';
   public urlPrefix: string = '/awsKeys';

   constructor(ipcNode: ServerIpcNode) {
      super(ipcNode, [
         session.loggedInOrForbidden,
      ]);
   }

   protected mountRoutes(): void {
      const logger = Logging.defaultLogger(__dirname);

      this.router.get('/', this.handleHttpErrors(async (request, response) => {

         const keys = await environmentDao.getAllAwsKeys(request.user!);
         response.json(keys);
      }));

      this.router.get('/:id(\\d+)', check.validParams(schema.idParams),
            this.handleHttpErrors(async (request, response) => {

         const awsKeysId = request.params.id;
         const awsKeys = await environmentDao.getAwsKeys(awsKeysId);

         if (!awsKeys) {
            throw new HttpError(http.NOT_FOUND);
         }
         response.json(awsKeys);
      }));
   }
}
