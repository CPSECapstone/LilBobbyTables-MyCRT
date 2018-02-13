#!/usr/bin/env node

import { CloudWatch, RDS, S3 } from 'aws-sdk';

import { ChildProgramType, CloudWatchMetricsBackend, Logging, MetricsBackend,
   MockMetricsBackend } from '@lbt-mycrt/common';
import { StorageBackend } from '@lbt-mycrt/common/dist/storage/backend';
import { LocalBackend } from '@lbt-mycrt/common/dist/storage/local-backend';
import { S3Backend } from '@lbt-mycrt/common/dist/storage/s3-backend';
import { getSandboxPath } from '@lbt-mycrt/common/dist/storage/sandbox';

import { CaptureConfig } from './args';
import { Capture } from './capture';
import { AwsWorkloadLogger } from './workload/aws-workload-logger';
import { LocalWorkloadLogger } from './workload/local-workload-logger';
import { WorkloadLogger } from './workload/workload-logger';

if (typeof(require) !== 'undefined' && require.main === module) {

   const logger = Logging.defaultLogger(__dirname);

   logger.info("Configuring MyCRT Capture Program");
   const config = CaptureConfig.fromCmdArgs();
   logger.info(config.toString());

   const buildCapture = (): Capture => {
      const storage = new S3Backend(new S3(), 'lil-test-environment'); // TODO: get bucket name from the environment
      const metrics = new CloudWatchMetricsBackend(new CloudWatch({region: 'us-east-2'}), 'DBInstanceIdentifier',
         'nfl2015', 60, ['Maximum']);
      const workloadLogger = new AwsWorkloadLogger(ChildProgramType.CAPTURE, config.id, new RDS(), storage);
      return new Capture(config, workloadLogger, storage, metrics);
   };

   const buildMockCapture = (): Capture => {
      const storage = new LocalBackend(getSandboxPath());
      const metrics = new MockMetricsBackend(5);
      const workloadLogger = new LocalWorkloadLogger(ChildProgramType.CAPTURE, config.id, storage);
      return new Capture(config, workloadLogger, storage, metrics);
   };

   const capture = config.mock ? buildMockCapture() : buildCapture();

   logger.info("Running MyCRT Capture Program");
   capture.run();

}

export { launch } from './launch';
export { CaptureConfig } from './args';
