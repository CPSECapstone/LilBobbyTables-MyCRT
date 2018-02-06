#!/usr/bin/env node

import { CloudWatch, S3 } from 'aws-sdk';

import { CloudWatchMetricsBackend, Logging, MetricsBackend, MockMetricsBackend } from '@lbt-mycrt/common';
import { StorageBackend } from '@lbt-mycrt/common/dist/storage/backend';
import { LocalBackend } from '@lbt-mycrt/common/dist/storage/local-backend';
import { S3Backend } from '@lbt-mycrt/common/dist/storage/s3-backend';
import { getSandboxPath } from '@lbt-mycrt/common/dist/storage/sandbox';

import { ReplayConfig } from './args';
import { Replay } from './replay';

if (typeof(require) !== 'undefined' && require.main === module) {

   const logger = Logging.defaultLogger(__dirname);

   logger.info("Configuring MyCRT Replay Program");
   const config = ReplayConfig.fromCmdArgs();
   logger.info(config.toString());

   const buildReplay = (): Replay => {
      const storage = new S3Backend(new S3(), 'lil-test-environment'); // TODO: get bucket name from the environment
      const metrics = new CloudWatchMetricsBackend(new CloudWatch({region: 'us-east-2'}), 'DBInstanceIdentifier',
         'nfl2015', 60, ['Maximum']);
      return new Replay(config, storage, metrics);
   };

   const buildMockReplay = (): Replay => {
      const storage = new LocalBackend(getSandboxPath());
      const metrics = new MockMetricsBackend(5);
      return new Replay(config, storage, metrics);
   };

   const replay = config.mock ? buildMockReplay() : buildReplay();

   logger.info("Running MyCRT Replay Program");
   replay.run();

}

export { launch } from './launch';
export { ReplayConfig } from './args';
