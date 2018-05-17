import { CaptureConfig, launch as launchCapture } from '@lbt-mycrt/capture';
import { ChildProgramStatus, ChildProgramType, ICapture, IReplay, Logging, ServerIpcNode } from "@lbt-mycrt/common";
import { launch as launchReplay, ReplayConfig } from '@lbt-mycrt/replay';
import * as http from 'http-status-codes';
import schedule = require('node-schedule');
import { captureDao, environmentDao } from '../dao/mycrt-dao';
import { SubProcessCreator } from "./create";

import { startCapture } from '../common/launching';
import { HttpError } from '../http-error';
import { settings } from '../settings';

const logger = Logging.defaultLogger(__dirname);

export class CaptureCreator extends SubProcessCreator {
   private endTime: Date | undefined;
   private duration: number;
   private ipcNode: ServerIpcNode;

   constructor(request: any, response: any, ipcNode: ServerIpcNode) {
      super(request, response);
      this.duration = request.body.duration;
      this.ipcNode = ipcNode;
   }

   public startCapture(capture: ICapture): void {
      logger.info(`Launching capture with id ${capture!.id!}`);

      // TODO: change implementation so that CaptureConfig() doesn’t pass in the
      //       environment id since that can be found in the database
      const config = new CaptureConfig(capture!.id!, capture!.envId!);
      config.mock = settings.captures.mock;
      config.interval = settings.captures.interval;
      config.intervalOverlap = settings.captures.intervalOverlap;
      config.metricsDelay = settings.captures.metricsDelay;
      config.filePrepDelay = settings.captures.filePrepDelay;
      launchCapture(config);
   }

   public scheduledChecks(): void {
      super.scheduledChecks();

      if (this.duration && this.duration < 60) {
         logger.debug("duration: " +  this.duration);
         throw new HttpError(http.BAD_REQUEST, `Duration must be at least 60 seconds`);
      }

      if (this.duration) {
         logger.debug("set duration");
         this.endTime = this.createEndDate(this.inputTime!, this.duration);
      }
   }

   public async createCaptureTemplate(request: any, response: any) {
      const env = await environmentDao.getEnvironment(request.body.envId);
      if (!env) {
         throw new HttpError(http.BAD_REQUEST, `Environment ${request.body.envId} does not exist`);
      }

      if (this.initialStatus === ChildProgramStatus.SCHEDULED && !request.body.scheduledStart) {
         throw new HttpError(http.BAD_REQUEST, `Cannot schedule without a start schedule time`);
      }

      // throw new HttpError(http.NOT_IMPLEMENTED, "Cameron, you need to test this!");
      let captureTemplate: ICapture | null = {
         type: ChildProgramType.CAPTURE,
         ownerId: request.user!.id,
         envId: env.id,
         status: this.initialStatus === ChildProgramStatus.SCHEDULED ?
            ChildProgramStatus.SCHEDULED : ChildProgramStatus.STARTED,
         name: request.body.name,
         scheduledEnd: this.endTime,
      };

      logger.debug("captureTemplate: " + captureTemplate);

      // if status is scheduled, start at a scheduled time
      if (this.initialStatus === ChildProgramStatus.SCHEDULED) {
         captureTemplate.scheduledStart = this.inputTime;
      }

      // assign capture, insert into db
      captureTemplate = await captureDao.makeCapture(captureTemplate);

      if (captureTemplate === null) {
         throw new HttpError(http.INTERNAL_SERVER_ERROR, `error creating capture in db`);
      }

      response.json(captureTemplate);

      if (this.initialStatus === ChildProgramStatus.SCHEDULED) {
         schedule.scheduleJob(this.inputTime!, () => { startCapture(captureTemplate!); });
      } else {
         startCapture(captureTemplate);
      }

      logger.info(`Successfully created capture!`);

      if (this.duration) {
         schedule.scheduleJob(this.endTime!, () => { this.stopScheduledCapture(captureTemplate!); }); // scheduled stop
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
