import { NextFunction, Request, Response} from 'express';
import * as http from 'http-status-codes';

import { IMimicReplay } from '@lbt-mycrt/cli/dist/mycrt-client/client';

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

export const noMimicReplaysOnSameDb = async (request: Request, response: Response, next: NextFunction) => {

   const replays: IMimicReplay[] = request.body.replays;
   let errors: boolean = false;
   const targetDbs = replays.map(((replay) => replay.host + replay.dbName));

   const replaysOnSameDB = targetDbs.length !== new Set(targetDbs).size;
   if (replaysOnSameDB) {
      response.status(http.BAD_REQUEST).json({
         code: http.BAD_REQUEST,
         message: "Cannot replay more than one replay on the same database. "
            + "Either specify a different db, or wait for that replay to complete.",
      });
      errors = true;
   }

   replays!.forEach(async (replay: IMimicReplay) => {
      const anyReplaysAlready: boolean = await replayDao.anyReplaysCurrentlyOnDb(replay.dbName, replay.host);
      if (anyReplaysAlready) {
         response.status(http.BAD_REQUEST).json({
            code: http.BAD_REQUEST,
            message: "There is already at least 1 replay running on database " + replay.dbName
               + ". Either specify a different db, or wait for that replay to complete.",
         });
         errors = true;
      }
   });

   if (!errors) {
      next();
   }

};
