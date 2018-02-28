import { CaptureDao, ConnectionPool, EnvironmentDao, mycrtDbConfig } from '@lbt-mycrt/common';

const pool = new ConnectionPool(mycrtDbConfig);
export const captureDao: CaptureDao = new CaptureDao(pool);
export const environmentDao: EnvironmentDao = new EnvironmentDao(pool);
