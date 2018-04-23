import { ISession } from './session';

declare global {
   namespace Express {
      export interface Request {
         session?: ISession;
      }
   }
}
