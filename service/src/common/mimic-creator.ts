import { CaptureConfig, launch as launchCapture } from '@lbt-mycrt/capture';
import { ChildProgramStatus, ChildProgramType, ICapture, IDbReference, IMimic, IReplay,
   IReplayFull, Logging, ServerIpcNode, SlackBot } from "@lbt-mycrt/common";
import { launch as launchReplay, ReplayConfig } from '@lbt-mycrt/replay';
import * as http from 'http-status-codes';
import schedule = require('node-schedule');
import { captureDao, environmentDao, replayDao } from '../dao/mycrt-dao';
import { SubProcessCreator } from "./create";

import { startCapture, startMimic } from '../common/launching';
import { HttpError } from '../http-error';
import { settings } from '../settings';
import { CaptureCreator } from './capture-creator';

const logger = Logging.defaultLogger(__dirname);

export class MimicCreator extends CaptureCreator {
   constructor(request: any, response: any, ipcNode: ServerIpcNode) {
      super(request, response, ipcNode);
   }

   public async createMimicTemplate(request: any, response: any) {
      const environment = await environmentDao.getEnvironment(request.body.envId);
      if (!environment) {
         throw new HttpError(http.NOT_FOUND, `Environment ${request.body.envId} does not exist`);
      }

      if (request.body.duration) {
         this.endTime = this.createEndDate(request.body.scheduledStart || new Date(),
            request.body.duration);
      }

      // make the capture
      let capture: ICapture | null = {
         type: ChildProgramType.CAPTURE,
         ownerId: request.user!.id,
         envId: environment.id,
         isMimic: true,
         status: request.body.scheduledStart ? ChildProgramStatus.SCHEDULED : ChildProgramStatus.STARTED,
         scheduledStart: request.body.scheduledStart ? request.body.scheduledStart : undefined,
         name: request.body.name,
         scheduledEnd: this.endTime,
      };

      capture = await captureDao.makeCapture(capture);
      if (capture === null) {
         throw new HttpError(http.INTERNAL_SERVER_ERROR, "Failed to create capture in DB");
      }

      // make all of the replays
      const replays: IReplay[] = [];
      for (const replay of (request.body.replays as IReplayFull[])) {

         let db: IDbReference | null = {
            name: replay.dbName,
            host: replay.host,
            user: replay.user,
            pass: replay.pass,
            instance: replay.instance,
            parameterGroup: replay.parameterGroup,
         };
         db = await environmentDao.makeDbReference(db);
         if (!db) {
            throw new HttpError(http.INTERNAL_SERVER_ERROR, "DB reference could not be created");
         }

         let replayTemplate: IReplay | null = {
            type: ChildProgramType.REPLAY,
            name: replay.name,
            captureId: capture!.id,
            dbId: db!.id,
            isMimic: true,
            status: request.body.scheduledStart ? ChildProgramStatus.SCHEDULED : ChildProgramStatus.STARTED,
            ownerId: request.user!.id,
            scheduledEnd: this.endTime,
         };
         replayTemplate = await replayDao.makeReplay(replayTemplate);
         if (!replayTemplate) {
            throw new HttpError(http.INTERNAL_SERVER_ERROR, "Failed to create replay in the DB");
         }

         replays.push(replayTemplate);
      }

      // make the mimic
      const mimic: IMimic = {
         ...capture,
         type: ChildProgramType.MIMIC,
         replays,
      };

      // Start it
      if (request.body.scheduledStart) {
         schedule.scheduleJob(request.body.scheduledStart, () => {
            startMimic(mimic);
            SlackBot.postMessage("Oi bobby here, the clock struck " + capture!.scheduledStart! +
               " so I started your mimicked capture and replays for `" + capture!.name + "`", environment.id!);
         });
      } else {
         startMimic(mimic);
      }

      // End it
      if (request.body.duration) {
         schedule.scheduleJob(this.endTime!, () => {
            this.stopScheduledCapture(capture!);
            SlackBot.postMessage("Swiggety swag :party-parrot: your mimicked captures and replays for `" +
               capture!.name + "` are complete. How cool was that?!", environment.id!);
         });
      }

      response.json(mimic);
   }
}
