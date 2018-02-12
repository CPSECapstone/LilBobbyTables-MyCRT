import { ConnectionPool, ReplayDao } from '@lbt-mycrt/common';

// tslint:disable-next-line:no-var-requires
const poolConfig = require('../db/config.json');
const pool = new ConnectionPool(poolConfig);

export const replayDao: ReplayDao = new ReplayDao(pool);
