import { CaptureConfig, launch as launchCapture } from '@lbt-mycrt/capture';
import { ChildProgramStatus, ChildProgramType, ICapture, IReplay, Logging, ServerIpcNode, IDbReference, IReplayFull, IMimic } from "@lbt-mycrt/common";
import { launch as launchReplay, ReplayConfig } from '@lbt-mycrt/replay';
import * as http from 'http-status-codes';
import schedule = require('node-schedule');
import { captureDao, environmentDao, replayDao } from '../dao/mycrt-dao';
import { SubProcessCreator } from "./create";

import { startCapture, startMimic } from '../common/launching';
import { HttpError } from '../http-error';
import { settings } from '../settings';

const logger = Logging.defaultLogger(__dirname);

export class MimicCreator extends SubProcessCreator {
   private endTime: Date | undefined;
   private duration: number;
   private ipcNode: ServerIpcNode;
   private env: any;
   private captureId: any;

   constructor(request: any, response: any, ipcNode: ServerIpcNode) {
      super(request, response);
      this.duration = request.body.duration;
      this.ipcNode = ipcNode;
   }

   public scheduledChecks(): void {
      super.scheduledChecks();
   }

   // tslint:disable-next-line:member-ordering
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
            status: ChildProgramStatus.STARTED,
            dbId: db!.id,
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
         });
      } else {
         startMimic(mimic);
      }

      // End it
      if (request.body.duration) {
         schedule.scheduleJob(this.endTime!, () => {
            this.stopScheduledCapture(capture!);
         });
      }

      response.json(mimic);
   }

   private checkDuration() {
      if (this.duration) {
         schedule.scheduleJob(this.endTime!, () => { this.stopScheduledCapture(this.template!); }); // scheduled stop
      }
   }

   private createEndDate(startTime: Date, seconds: number): Date {
      const endTime = new Date(startTime.getTime());
      endTime.setSeconds(startTime.getSeconds() + seconds);
      return endTime;
   }

   private async stopScheduledCapture(capture: ICapture): Promise<void> {
      // TODO: Query database to check if capture is running,
      //       if yes, send "await this.ipcNode.stopCapture(capture.id!);"
      await this.ipcNode.stopCapture(capture.id!);
      logger.info(`Capture ${capture.id!} stopped`);
   }
}
