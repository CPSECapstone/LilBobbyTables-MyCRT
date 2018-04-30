import { IUser } from '@lbt-mycrt/common';

declare global {
   namespace Express {
      export interface Request {
         user?: IUser;
      }
   }
}
