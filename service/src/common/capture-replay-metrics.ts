import { S3 } from 'aws-sdk';
import * as http from 'http-status-codes';

import { ChildProgramStatus, ChildProgramType, IChildProgram, IEnvironmentFull, IMetricsList,
    Logging, MetricsStorage, MetricType } from '@lbt-mycrt/common';
import { launch, ReplayConfig } from '@lbt-mycrt/replay';

import { StorageBackend } from '@lbt-mycrt/common/dist/storage/backend';
import { LocalBackend } from '@lbt-mycrt/common/dist/storage/local-backend';
import { S3Backend } from '@lbt-mycrt/common/dist/storage/s3-backend';
import { getSandboxPath } from '@lbt-mycrt/common/dist/storage/sandbox';

import { HttpError } from '../http-error';
import { settings } from '../settings';

const logger = Logging.defaultLogger(__dirname);

/**
 * Retrieve and return the capture/replay metrics from S3
 */
export const getMetrics = (childProgram: IChildProgram, environment: IEnvironmentFull, metricType?: MetricType | null):
      Promise<IMetricsList | IMetricsList[]> => {

   logger.info(`Getting ${metricType} metrics for ${childProgram.type} ${childProgram.id}`);

   const validStatus = childProgram.status && [ChildProgramStatus.DONE, ChildProgramStatus.RUNNING,
   ChildProgramStatus.STOPPING].indexOf(childProgram.status) > -1;
   if (!validStatus) {
      throw new HttpError(http.CONFLICT);
   }

   let backend: StorageBackend;
   const mocking: boolean = settings.captures.mock && childProgram.type === ChildProgramType.CAPTURE
      || settings.replays.mock && childProgram.type === ChildProgramType.REPLAY;
   if (mocking) {
      backend = new LocalBackend(getSandboxPath(), environment.prefix);
   } else {
      const awsConfig: S3.ClientConfiguration = {
         region: environment.region,
         accessKeyId: environment.accessKey,
         secretAccessKey: environment.secretKey,
      };
      backend = new S3Backend(new S3(awsConfig), environment.bucket, environment.prefix);
   }
   const storage = new MetricsStorage(backend);

   return storage.readMetrics(childProgram!, metricType);
};
