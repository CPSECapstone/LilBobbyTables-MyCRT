import * as http from 'http-status-codes';
import schedule = require('node-schedule');

import { CaptureConfig, launch as launchCapture } from '@lbt-mycrt/capture';
import { ChildProgramStatus, ChildProgramType, ICapture, IDbReference, IReplay, Logging } from "@lbt-mycrt/common";
import { launch as launchReplay, ReplayConfig } from '@lbt-mycrt/replay';
import { captureDao, environmentDao, replayDao } from '../dao/mycrt-dao';
import { SubProcessCreator } from "./create";

import { HttpError } from '../http-error';
import { settings } from '../settings';
// import { IReplay } from '@lbt-mycrt/common/dist/data';

const logger = Logging.defaultLogger(__dirname);

export class ReplayCreator extends SubProcessCreator {
   public dbReference: IDbReference;
   public captureId: any;

   constructor(request: any, response: any) {
      super(request, response);

      this.captureId = request.body.captureId;

      this.dbReference = {
         name: request.body.dbName,
         host: request.body.host,
         user: request.body.user,
         pass: request.body.pass,
         instance: request.body.instance,
         parameterGroup: request.body.parameterGroup,
      };
   }

   public startReplay(replay: IReplay): void {
      logger.info(`Launching replay with id ${replay!.id!} for capture ${replay!.captureId!}`);
      const config = new ReplayConfig(replay!.id!, replay!.captureId!, replay!.dbId!);
      config.mock = settings.replays.mock;
      config.interval = settings.replays.interval;
      config.intervalOverlap = settings.replays.intervalOverlap;
      config.metricsDelay = settings.replays.metricsDelay;
      config.filePrepDelay = settings.replays.filePrepDelay;

      launchReplay(config);
   }

   public async createReplayTemplate(request: any, response: any) {
      // let replayTemplate: IReplay | null;

      const cap = await captureDao.getCapture(request.body.captureId);
      if (cap == null) {
            throw new HttpError(http.BAD_REQUEST, `Capture ${request.body.captureId} does not exist`);
      }

      const db = await environmentDao.makeDbReference(this.dbReference);
      if (db && !db.id) {
         throw new HttpError(http.BAD_REQUEST, "DB reference was not properly created");
      }

      this.createTemplate(request, ChildProgramType.REPLAY);
      this.template.captureId = request.body.captureId;
      this.template.dbId = db!.id;
      this.template.ownerId = request.user!.id;

      // if status is scheduled, start at a scheduled time
      if (this.initialStatus === ChildProgramStatus.SCHEDULED) {
         this.template.scheduledStart = this.inputTime;
      }

      logger.debug("before: ");
      logger.debug(this.template);

      this.template = await replayDao.makeReplay(this.template);
      logger.debug("this.template: ");
      logger.debug(this.template);

      this.checkTemplateInDB();

      response.json(this.template);

      if (this.initialStatus === ChildProgramStatus.SCHEDULED) {
         schedule.scheduleJob(this.inputTime!, () => { this.startReplay(this.template!); });
      } else {
         this.startReplay(this.template);
      }

      logger.info(`Successfully created replay!`);
   }
}
