import { CaptureDao, ConnectionPool, EnvironmentDao, mycrtDbConfig, ReplayDao } from '@lbt-mycrt/common';

const pool = new ConnectionPool(mycrtDbConfig);

export const captureDao: CaptureDao = new CaptureDao(pool);
export const environmentDao: EnvironmentDao = new EnvironmentDao(pool);
export const replayDao: ReplayDao = new ReplayDao(pool);
