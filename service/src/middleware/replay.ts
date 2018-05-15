import { NextFunction, Request, Response} from 'express';
import * as http from 'http-status-codes';

import { replayDao } from '../dao/mycrt-dao';

export const noReplaysOnTargetDb = async (request: Request, response: Response, next: NextFunction) => {

   const dbName: string = request.body.dbName;
   const dbHost: string = request.body.host;

   const anyReplaysAlready: boolean = await replayDao.anyReplaysCurrentlyOnDb(dbName, dbHost);

   if (anyReplaysAlready) {
      response.status(http.BAD_REQUEST).json({
         code: http.BAD_REQUEST,
         message: "There is already at least 1 replay running on that database. "
            + "Either specify a different db, or wait for that replay to complete.",
      });
   } else {
      next();
   }

};
