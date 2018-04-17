import { ChildProgramStatus, Logging } from '@lbt-mycrt/common';

import { replayDao } from '../dao/mycrt-dao';

const logger = Logging.defaultLogger(__dirname);

export async function markAbandonedReplaysAsFailed() {
   logger.info(`Looking for abandoned replays`);

   const abandonedReplays = await replayDao.getAbandonedReplays();
   if (abandonedReplays) {
      logger.info(`Found ${abandonedReplays.length} abandoned replays.` +
         `Marking them as failed.`);
      for (const replay of abandonedReplays) {
         logger.info(`Marking replay ${replay.id} as ${ChildProgramStatus.FAILED}`);
         await replayDao.updateReplayStatus(replay.id!, ChildProgramStatus.FAILED);
      }
   } else {
      logger.error(`Failed to get abandoned replays`);
   }
}
