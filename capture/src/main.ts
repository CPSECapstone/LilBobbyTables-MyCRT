#!/usr/bin/env node

import { CloudWatch, RDS, S3 } from 'aws-sdk';

import { ChildProgramStatus, ChildProgramType, CloudWatchMetricsBackend, Logging } from '@lbt-mycrt/common';
import { MetricsBackend, MockMetricsBackend } from '@lbt-mycrt/common';
import { StorageBackend } from '@lbt-mycrt/common/dist/storage/backend';
import { LocalBackend } from '@lbt-mycrt/common/dist/storage/local-backend';
import { S3Backend } from '@lbt-mycrt/common/dist/storage/s3-backend';
import { getSandboxPath } from '@lbt-mycrt/common/dist/storage/sandbox';

import { CaptureConfig } from './args';
import { Capture } from './capture';
import { captureDao, environmentDao } from './dao';
import { AwsWorkloadLogger } from './workload/aws-workload-logger';
import { LocalWorkloadLogger } from './workload/local-workload-logger';
import { WorkloadLogger } from './workload/workload-logger';

const DBIdentifier: string = 'DBInstanceIdentifier';
const period: number = 60;
const statistics: string[] = ['Maximum'];

export async function validCapture(config: CaptureConfig): Promise<boolean> {

   const logger = Logging.defaultLogger(__dirname);
   if (!config) { return false; }

   const capture = await captureDao.getCapture(config.id);
   if (!capture ) {
      logger.info(`A capture with id: ${config.id} does not exist in the database`);
      // TODO: We might want to create the capture here in the future.
      return false;
   }

   if ((capture.status === ChildProgramStatus.STARTED || capture.status === ChildProgramStatus.SCHEDULED)) {
      return true;
   } else {
      logger.info(`This capture is ${capture.status || "Null"} and cannot be run twice`);
      return false;
   }
}

async function runCapture(): Promise<void> {
   const logger = Logging.defaultLogger(__dirname);

   logger.info("Configuring MyCRT Capture Program");
   const config = CaptureConfig.fromCmdArgs();
   logger.info(config.toString());

   const valid = await validCapture(config);
   if (!valid) {
      logger.info(`This Capture is invalid....`);
      process.exit();
   }

   const env = await environmentDao.getEnvironmentFull(config.envId);
   if (env) {
      const buildCapture = (): Capture => {
         const awsConfig = {region: env.region, accessKeyId: env.accessKey, secretAccessKey: env.secretKey};
         const storage = new S3Backend(new S3(awsConfig), env.bucket, env.prefix);
         const metrics = new CloudWatchMetricsBackend(new CloudWatch(awsConfig), DBIdentifier, env.instance, period,
            statistics);
         const workloadLogger: WorkloadLogger = new AwsWorkloadLogger(ChildProgramType.CAPTURE, config.id,
            new RDS(awsConfig), storage, env);
         return new Capture(config, workloadLogger, storage, metrics, env);
      };

      const buildMockCapture = (): Capture => {
         const storage = new LocalBackend(getSandboxPath(), env.prefix);
         const metrics = new MockMetricsBackend(5);
         const workloadLogger = new LocalWorkloadLogger(ChildProgramType.CAPTURE, config.id, storage, env);
         return new Capture(config, workloadLogger, storage, metrics, env);
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
