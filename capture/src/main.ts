#!/usr/bin/env node

import { CloudWatch, S3 } from 'aws-sdk';

import { IEnvironmentFull, Logging } from '@lbt-mycrt/common';
import { CloudWatchMetricsBackend, MetricsBackend, MockMetricsBackend } from '@lbt-mycrt/common';
import { StorageBackend } from '@lbt-mycrt/common/dist/storage/backend';
import { LocalBackend } from '@lbt-mycrt/common/dist/storage/local-backend';
import { S3Backend } from '@lbt-mycrt/common/dist/storage/s3-backend';
import { getSandboxPath } from '@lbt-mycrt/common/dist/storage/sandbox';

import { CaptureConfig } from './args';
import { Capture } from './capture';
import { environmentDao } from './dao';

const DBIdentifier: string = 'DBInstanceIdentifier';

async function runCapture(): Promise<void> {
   const logger = Logging.defaultLogger(__dirname);

   const env = await environmentDao.getEnvironmentFull(1);

   if (env) {
      logger.info("Configuring MyCRT Capture Program");
      const config = CaptureConfig.fromCmdArgs();
      logger.info(config.toString());

      const buildCapture = (): Capture => {
         const storage = new S3Backend(new S3(), env.bucket);
         const metrics = new CloudWatchMetricsBackend(new CloudWatch({region: 'us-east-2'}), 'DBInstanceIdentifier',
            'nfl2015', 60, ['Maximum']);
         return new Capture(config, storage, metrics);
      };

      const buildMockCapture = (): Capture => {
         const storage = new LocalBackend(getSandboxPath());
         const metrics = new MockMetricsBackend(5);
         return new Capture(config, storage, metrics);
      };

      const capture = config.mock ? buildMockCapture() : buildCapture();

      logger.info("Running MyCRT Capture Program");
      capture.run();
   }
}

if (typeof(require) !== 'undefined' && require.main === module) {
   runCapture();
}

export { launch } from './launch';
export { CaptureConfig } from './args';
