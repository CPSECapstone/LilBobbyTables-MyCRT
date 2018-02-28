#!/usr/bin/env node

import { CloudWatch, S3 } from 'aws-sdk';

import { CloudWatchMetricsBackend, Logging, MetricsBackend, MockMetricsBackend } from '@lbt-mycrt/common';
import { StorageBackend } from '@lbt-mycrt/common/dist/storage/backend';
import { LocalBackend } from '@lbt-mycrt/common/dist/storage/local-backend';
import { S3Backend } from '@lbt-mycrt/common/dist/storage/s3-backend';
import { getSandboxPath } from '@lbt-mycrt/common/dist/storage/sandbox';

import { ReplayConfig } from './args';
import { captureDao, environmentDao } from './dao';
import { Replay } from './replay';

const DBIdentifier: string = 'DBInstanceIdentifier';

async function runReplay(): Promise<void> {
   const logger = Logging.defaultLogger(__dirname);

   logger.info("Configuring MyCRT Replay Program");
   const config = ReplayConfig.fromCmdArgs();
   logger.info(config.toString());

   const capture = await captureDao.getCapture(config.captureId);

   if (capture && capture.envId) {
      const capEnv = await environmentDao.getEnvironmentFull(capture.envId);
      const db = await environmentDao.getDbReference(config.dbId);

      if (capEnv && db && db.instance !== undefined) {

            const buildReplay = (): Replay => {
               const storage = new S3Backend(
                  new S3({
                     region: capEnv.region,
                     accessKeyId: capEnv.accessKey,
                     secretAccessKey: capEnv.secretKey}), capEnv.bucket);
               const metrics = new CloudWatchMetricsBackend(
                  new CloudWatch({ region: capEnv.region,
                                   accessKeyId: capEnv.accessKey,
                                   secretAccessKey: capEnv.secretKey }),
                  DBIdentifier, db.instance!, 60, ['Maximum']);
               return new Replay(config, storage, metrics, db);
            };

            const buildMockReplay = (): Replay => {
               const storage = new LocalBackend(getSandboxPath());
               const metrics = new MockMetricsBackend(5);
               return new Replay(config, storage, metrics, db);
            };

            const replay = config.mock ? buildMockReplay() : buildReplay();

            logger.info("Running MyCRT Replay Program");
            replay.run();
         }
   }

}

if (typeof(require) !== 'undefined' && require.main === module) {
   runReplay();
}

export { launch } from './launch';
export { ReplayConfig } from './args';
