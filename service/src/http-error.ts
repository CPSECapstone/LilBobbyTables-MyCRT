import * as http from 'http-status-codes';

export class HttpError extends Error {

   public readonly IS_HTTP_ERROR = true;

   constructor(public readonly code: number, message?: string) {
      super(message);
   }

}
