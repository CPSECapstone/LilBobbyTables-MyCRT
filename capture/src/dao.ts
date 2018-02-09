import { CaptureDao, ConnectionPool } from '@lbt-mycrt/common';

// tslint:disable-next-line:no-var-requires
const poolConfig = require('../db/config.json');
const pool = new ConnectionPool(poolConfig);

export const captureDao: CaptureDao = new CaptureDao(pool);
