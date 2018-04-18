import { CaptureConfig, launch as launchCapture } from '@lbt-mycrt/capture';
import { ICapture, Logging } from "@lbt-mycrt/common";

import { settings } from '../settings';

const logger = Logging.defaultLogger(__dirname);

export function startCapture(capture: ICapture): void {
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
