import { ReplayDao } from '@lbt-mycrt/common';
import { pool } from '../dao';

export const replayDao: ReplayDao = new ReplayDao(pool);
