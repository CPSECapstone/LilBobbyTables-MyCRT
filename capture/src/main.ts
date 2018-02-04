#!/usr/bin/env node

import { CloudWatch, S3 } from 'aws-sdk';

import { Logging } from '@lbt-mycrt/common';
import { MetricConfiguration } from '@lbt-mycrt/common/dist/metrics/metrics';
import { StorageBackend } from '@lbt-mycrt/common/dist/storage/backend';
import { LocalBackend } from '@lbt-mycrt/common/dist/storage/local-backend';
import { S3Backend } from '@lbt-mycrt/common/dist/storage/s3-backend';
import { getSandboxPath } from '@lbt-mycrt/common/dist/storage/sandbox';

import { CaptureConfig } from './args';
import { Capture } from './capture';

if (typeof(require) !== 'undefined' && require.main === module) {

   const logger = Logging.getLogger(true, Logging.simpleFormatter);

   logger.info("Configuring MyCRT Capture Program");
   const config = CaptureConfig.fromCmdArgs();
   logger.info(config.toString());

   const storage: StorageBackend = config.mock ? new LocalBackend(getSandboxPath())
      : new S3Backend(new S3(), "lil-test-environment"); // TODO: get bucket name from the environment
   const metrics = new MetricConfiguration(new CloudWatch({region: 'us-east-2'}), 'DBInstanceIdentifier', 'nfl2015', 60,
      ['Maximum']);
   const capture = new Capture(config, storage, metrics);

   logger.info("Running MyCRT Capture Program");
   capture.run();

}

export { launch } from './launch';
export { CaptureConfig } from './args';
