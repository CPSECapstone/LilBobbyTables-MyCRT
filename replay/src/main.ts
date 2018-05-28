#!/usr/bin/env node

import { CloudWatch, S3 } from 'aws-sdk';

import { ChildProgramStatus, IDbReference, IEnvironmentFull } from '@lbt-mycrt/common';
import { CloudWatchMetricsBackend, Logging, MetricsBackend, MockMetricsBackend } from '@lbt-mycrt/common';
import { StorageBackend } from '@lbt-mycrt/common/dist/storage/backend';
import { LocalBackend } from '@lbt-mycrt/common/dist/storage/local-backend';
import { S3Backend } from '@lbt-mycrt/common/dist/storage/s3-backend';
import { getSandboxPath } from '@lbt-mycrt/common/dist/storage/sandbox';

import { ReplayConfig } from './args';
import { captureDao, environmentDao, replayDao } from './dao';
import { Replay } from './replay';

const DBIdentifier: string = 'DBInstanceIdentifier';

async function validReplay(config: ReplayConfig): Promise<boolean> {

   const logger = Logging.defaultLogger(__dirname);
   if (!config) { return false; }

   const replay = await replayDao.getReplay(config.id);
   if (!replay ) {
      logger.info(`A replay with id: ${config.id} does not exist in the database`);
      // TODO: We might want to create the replay here in the future.
      return false;
   }

   if ((replay.status === ChildProgramStatus.STARTED || replay.status === ChildProgramStatus.SCHEDULED)) {
      return true;
   } else {
      logger.info(`This replay is ${replay.status || "Null"} and cannot be run twice`);
      return false;
   }
}

function buildMockReplay(config: ReplayConfig, env: IEnvironmentFull, db: IDbReference): Replay {
   const storage = new LocalBackend(getSandboxPath(), env.prefix);
   const metrics = new MockMetricsBackend(5);
   return new Replay(config, storage, metrics, db);
}

function buildLiveReplay(config: ReplayConfig, env: IEnvironmentFull, db: IDbReference): Replay {
   const storage = new S3Backend(
      new S3({
         region: env.region,
         accessKeyId: env.accessKey,
         secretAccessKey: env.secretKey}), env.bucket, env.prefix);
   const metrics = new CloudWatchMetricsBackend(
      new CloudWatch({ region: env.region,
                        accessKeyId: env.accessKey,
                        secretAccessKey: env.secretKey }),
      DBIdentifier, db.instance!, 60, ['Maximum']);
   return new Replay(config, storage, metrics, db);
}

async function buildReplay(config: ReplayConfig): Promise<Replay | null> {
   const capture = await captureDao.getCapture(config.captureId);

   if (capture && capture.envId) {
      const capEnv = await environmentDao.getEnvironmentFull(capture.envId);
      const db = await environmentDao.getDbReference(config.dbId);

      if (capEnv && db && db.instance !== null) {
         return config.mock ? buildMockReplay(config, capEnv, db) : buildLiveReplay(config, capEnv, db);
      } else { return null; }
   } else {return null; }
}

async function runReplay(): Promise<void> {
   const logger = Logging.defaultLogger(__dirname);

   logger.info("Configuring MyCRT Replay Program");
   const config = ReplayConfig.fromCmdArgs();
   logger.info(config.toString());

   const valid = await validReplay(config);
   if (!valid) {
      logger.info(`This Replay is invalid....`);
      process.exit();
   }

   const replay = await buildReplay(config);
   if (replay) {
      logger.info("Running MyCRT Replay Program");
      replay.run();
   }
}

if (typeof(require) !== 'undefined' && require.main === module) {
   runReplay();
}

export { launch } from './launch';
export { ReplayConfig } from './args';
