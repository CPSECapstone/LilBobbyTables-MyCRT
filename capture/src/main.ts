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
const period: number = 60;
const statistics: string[] = ['Maximum'];

async function runCapture(): Promise<void> {
   const logger = Logging.defaultLogger(__dirname);

   logger.info("Configuring MyCRT Capture Program");
   const config = CaptureConfig.fromCmdArgs();
   logger.info(config.toString());

   const env = await environmentDao.getEnvironmentFull(config.envId);
   if (env) {
      const buildCapture = (): Capture => {
         const storage = new S3Backend(
            new S3({region: env.region, accessKeyId: env.accessKey, secretAccessKey: env.secretKey}), env.bucket,
         );
         const metrics = new CloudWatchMetricsBackend(
            new CloudWatch({region: env.region, accessKeyId: env.accessKey, secretAccessKey: env.secretKey}),
            DBIdentifier, env.instance, period, statistics,
         );
         return new Capture(config, storage, metrics, env);
      };

      const buildMockCapture = (): Capture => {
         const storage = new LocalBackend(getSandboxPath());
         const metrics = new MockMetricsBackend(5);
         return new Capture(config, storage, metrics, env);
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
