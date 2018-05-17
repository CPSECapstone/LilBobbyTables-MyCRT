import { ChildProgramStatus } from '@lbt-mycrt/common';
import * as http from 'http-status-codes';
import schedule = require('node-schedule');

import { HttpError } from '../http-error';

export abstract class SubProcessCreator {
   public initialStatus: string | undefined;
   public inputTime: Date | undefined;
   // private endTime: Date | undefined;
   // private duration: number | undefined;

   constructor(request: any, response: any) {
      this.initialStatus = request.body.status;
      this.inputTime = request.body.scheduledStart;   // retrieve scheduled time
   }

   public scheduledChecks(): void {
      if (!this.inputTime) {
         this.inputTime = new Date();
      }
   }
}
