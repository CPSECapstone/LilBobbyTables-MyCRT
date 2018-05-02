import { scheduleJob } from 'node-schedule';

import { ChildProgramStatus, ICapture, Logging } from '@lbt-mycrt/common';

import { startCapture } from '../common/launching';
import { captureDao } from '../dao/mycrt-dao';

const logger = Logging.defaultLogger(__dirname);

function doReschedule(capture: ICapture) {
   logger.info(`Scheduling capture ${capture.id} for ${capture.scheduledStart}`);
   scheduleJob(capture.scheduledStart!, () => {
      startCapture(capture);
   });
}

async function markFailed(capture: ICapture) {
   logger.info(`Setting capture ${capture.id} status to ${ChildProgramStatus.FAILED}`);
   await captureDao.updateCaptureStatus(capture.id!, ChildProgramStatus.FAILED, 'Server down when scheduled to start');
}

/**
 * If there are any captures that have been scheduled, they can either:
 * - be re-scheduled if their scheduled start times are in the future
 * - be marked as failed if their scheduled start times have passed
 */
export async function rescheduleCaptures() {
   logger.info("Looking for captures to reschedule");
   const now = new Date();

   const futureScheduled = await captureDao.getScheduledCaptures(true, now);
   if (futureScheduled) {
      logger.info(`found ${futureScheduled.length} captures scheduled for the future. ` +
         `These will be rescheduled`);
      for (const capture of futureScheduled) {
         doReschedule(capture);
      }
   } else {
      logger.error(`Could not get future scheduled captures`);
   }

   const pastScheduled = await captureDao.getScheduledCaptures(false, now);
   if (pastScheduled) {
      logger.info(`found ${pastScheduled.length} captures scheduled for the past. ` +
         `These will be marked as failed`);
      for (const capture of pastScheduled) {
         await markFailed(capture);
      }
   } else {
      logger.error(`Could not get past scheduled captures`);
   }
}

// TODO
//
// There are other cases we may want to consider setting captures to a failed state. For example,
// if its status is running. But, it may have been launched from the command line, so we may want
// to wait and figure out how best to handle these cases.
//
