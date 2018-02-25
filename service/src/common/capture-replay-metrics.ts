import * as http from 'http-status-codes';

import { ChildProgramStatus, ChildProgramType, IChildProgram, IMetricsList,
    Logging, MetricsStorage, MetricType } from '@lbt-mycrt/common';
import { launch, ReplayConfig } from '@lbt-mycrt/replay';

import { LocalBackend } from '@lbt-mycrt/common/dist/storage/local-backend';
import { S3Backend } from '@lbt-mycrt/common/dist/storage/s3-backend';
import { getSandboxPath } from '@lbt-mycrt/common/dist/storage/sandbox';

import { HttpError } from '../http-error';

const logger = Logging.defaultLogger(__dirname);

/**
 * Retrieve and return the capture/replay metrics from S3
 */
export const getMetrics = (childProgram: IChildProgram | null, metricType?: MetricType | null):
        Promise<IMetricsList | IMetricsList[]> => {

    // TODO: add configuration for choosing the backend
    // const storage: MetricsStorage = new MetricsStorage(new S3Backend(new S3(), 'lil-test-environment'));
    const storage = new MetricsStorage(new LocalBackend(getSandboxPath()));

    if (!childProgram) {
       throw new HttpError(http.NOT_FOUND);
    }

    logger.info(`Getting ${metricType} metrics for ${childProgram.type} ${childProgram.id}`);

    const validStatus = childProgram.status && [ChildProgramStatus.DONE, ChildProgramStatus.RUNNING,
          ChildProgramStatus.STOPPING].indexOf(childProgram.status) > -1;
    if (!validStatus) {
       throw new HttpError(http.CONFLICT);
    }

    return storage.readMetrics(childProgram!, metricType);
};
