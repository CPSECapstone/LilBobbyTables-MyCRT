import { ChildProgramStatus, ChildProgramType, ICapture, IReplay, Logging } from '@lbt-mycrt/common';
import * as http from 'http-status-codes';
import schedule = require('node-schedule');

import { HttpError } from '../http-error';

const logger = Logging.defaultLogger(__dirname);

export abstract class SubProcessCreator {
   public initialStatus: string | undefined;
   public inputTime: Date | undefined;
   public template: any;
   // private endTime: Date | undefined;
   // private duration: number | undefined;
   // TODO: REQUEST AND RESPONSE IN PARENT

   constructor(request: any, response: any) {
      this.initialStatus = request.body.status;
      this.inputTime = request.body.scheduledStart;   // retrieve scheduled time
   }

   public scheduledChecks(): void {
      if (!this.inputTime) {
         this.inputTime = new Date();
      }
   }

   public checkScheduledStatus(request: any) {
      if (this.initialStatus === ChildProgramStatus.SCHEDULED && !request.body.scheduledStart) {
         throw new HttpError(http.BAD_REQUEST, `Cannot schedule without a start schedule time`);
      }
   }

   public createTemplate(request: any, type: any): any {
      logger.debug("type: " + type);
      if (type === ChildProgramType.CAPTURE) {
         this.template = this.template as ICapture;
         this.template = {
            name: request.body.name,
            status: this.initialStatus === ChildProgramStatus.SCHEDULED ?
               ChildProgramStatus.SCHEDULED : ChildProgramStatus.STARTED,
            type: ChildProgramType.CAPTURE,
         };
      } else {
         this.template = this.template as IReplay;
         this.template = {
            name: request.body.name,
            status: this.initialStatus === ChildProgramStatus.SCHEDULED ?
               ChildProgramStatus.SCHEDULED : ChildProgramStatus.STARTED,
            type: ChildProgramType.REPLAY,
         };
      }
   }

   public checkScheduledStartTime() {
      if (this.initialStatus === ChildProgramStatus.SCHEDULED) {
         this.template.scheduledStart = this.inputTime;
      }
   }

   public checkTemplateInDB() {
      if (this.template === null) {
         throw new HttpError(http.INTERNAL_SERVER_ERROR, `error creating capture in db`);
      }
   }
}
