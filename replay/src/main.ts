#!/usr/bin/env node

import { CloudWatch, S3 } from 'aws-sdk';

import { CloudWatchMetricsBackend, Logging, MetricsBackend, MockMetricsBackend } from '@lbt-mycrt/common';
import { StorageBackend } from '@lbt-mycrt/common/dist/storage/backend';
import { LocalBackend } from '@lbt-mycrt/common/dist/storage/local-backend';
import { S3Backend } from '@lbt-mycrt/common/dist/storage/s3-backend';
import { getSandboxPath } from '@lbt-mycrt/common/dist/storage/sandbox';

import { ReplayConfig } from './args';
import { environmentDao } from './dao';
import { Replay } from './replay';

const DBIdentifier: string = 'DBInstanceIdentifier';

async function runReplay(): Promise<void> {

   const logger = Logging.defaultLogger(__dirname);

   logger.info("Configuring MyCRT Replay Program");
   const config = ReplayConfig.fromCmdArgs();
   logger.info(config.toString());

   const env = await environmentDao.getEnvironmentFull(config.envId);
   if (env) {

      const buildReplay = (): Replay => {
         const storage = new S3Backend(
            new S3({
               region: env.region,
               accessKeyId: env.accessKey,
               secretAccessKey: env.secretKey}), env.bucket);
         const metrics = new CloudWatchMetricsBackend(
            new CloudWatch({ region: env.region,
                             accessKeyId: env.accessKey,
                             secretAccessKey: env.secretKey }),
            DBIdentifier, env.instance, 60, ['Maximum']);
         return new Replay(config, storage, metrics, env);
      };

      const buildMockReplay = (): Replay => {
         const storage = new LocalBackend(getSandboxPath());
         const metrics = new MockMetricsBackend(5);
         return new Replay(config, storage, metrics, env);
      };

      const replay = config.mock ? buildMockReplay() : buildReplay();

      logger.info("Running MyCRT Replay Program");
      replay.run();
   }
}

if (typeof(require) !== 'undefined' && require.main === module) {
   runReplay();
}

export { launch } from './launch';
export { ReplayConfig } from './args';
