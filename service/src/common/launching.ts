import { CaptureConfig, launch as launchCapture } from '@lbt-mycrt/capture';
import { ICapture, IReplay, Logging } from "@lbt-mycrt/common";
import { launch as launchReplay, ReplayConfig } from '@lbt-mycrt/replay';

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

export function startReplay(replay: IReplay): void {
   logger.info(`Launching replay with id ${replay!.id!} for capture ${replay!.captureId!}`);
   const config = new ReplayConfig(replay!.id!, replay!.captureId!, replay!.dbId!);
   config.mock = settings.replays.mock;
   config.interval = settings.replays.interval;
   config.intervalOverlap = settings.replays.intervalOverlap;
   config.metricsDelay = settings.replays.metricsDelay;
   config.filePrepDelay = settings.replays.filePrepDelay;

   launchReplay(config);
}
