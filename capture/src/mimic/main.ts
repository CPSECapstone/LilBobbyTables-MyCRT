#!/usr/bin/env node

import { CloudWatch, RDS, S3 } from 'aws-sdk';

import { ChildProgramStatus, ChildProgramType, CloudWatchMetricsBackend, Logging,
   MetricsBackend, MockMetricsBackend} from '@lbt-mycrt/common';
import { LocalBackend } from '@lbt-mycrt/common/dist/storage/local-backend';
import { S3Backend } from '@lbt-mycrt/common/dist/storage/s3-backend';
import { getSandboxPath } from '@lbt-mycrt/common/dist/storage/sandbox';

import { captureDao, environmentDao } from '../dao';
import { validCapture } from '../main';
import { AwsWorkloadLogger } from '../workload/aws-workload-logger';
import { LocalWorkloadLogger } from '../workload/local-workload-logger';
import { WorkloadLogger } from '../workload/workload-logger';
import { MimicConfig } from './args';
import { Mimic } from './mimic';

const logger = Logging.defaultLogger(__dirname);

async function validMimic(config: MimicConfig): Promise<boolean> {

   const captureValid = await validCapture(config);
   if (!captureValid) { return false; }

   // TODO: validate the replays

   return true;
}

async function runMimic(): Promise<void> {

   logger.info(`Configuring MyCRT Mimic Program`);
   const config = MimicConfig.fromCmdArgs();
   logger.info(config.toString());

   const valid = await validMimic(config);
   if (!valid) {
      logger.warn(`This Mimic is invalid...`);
      process.exit();
   }

   const env = await environmentDao.getEnvironmentFull(config.envId);
   if (!env) {
      logger.warn(`Couldn't get an environment for this mimic`);
      process.exit();
      return;
   }

   const buildMimic = (): Mimic => {
      const awsConfig = {region: env.region, accessKeyId: env.accessKey, secretAccessKey: env.secretKey};
      const storage = new S3Backend(new S3(awsConfig), env.bucket, env.prefix);
      const metrics = new CloudWatchMetricsBackend(new CloudWatch(awsConfig), 'DBInstanceIdentifier',
         env.instance, 60, ['Maximum']);
      const workloadLogger: WorkloadLogger = new AwsWorkloadLogger(ChildProgramType.MIMIC, config.id,
         new RDS(awsConfig), storage, env);
      return new Mimic(config, workloadLogger, storage, metrics, env);
   };

   const buildMockMimic = (): Mimic => {
      const storage = new LocalBackend(getSandboxPath(), env.prefix);
      const metrics = new MockMetricsBackend(5);
      const workloadLogger = new LocalWorkloadLogger(ChildProgramType.MIMIC, config.id, storage, env);
      return new Mimic(config, workloadLogger, storage, metrics, env);
   };

   const mimic = config.mock ? buildMockMimic() : buildMimic();

   logger.info(`Running MyCRT Mimic Program`);
   mimic.run();

}

if (typeof(require) !== 'undefined' && require.main === module) {
   runMimic();
}

export { launch } from './launch';
export { MimicConfig } from './args';
