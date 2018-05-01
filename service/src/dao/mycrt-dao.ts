import { CaptureDao, ConnectionPool, EnvironmentDao, EnvironmentInviteDao, mycrtDbConfig, ReplayDao,
   SessionDao, UserDao } from '@lbt-mycrt/common';

const pool = new ConnectionPool(mycrtDbConfig);

export const captureDao: CaptureDao = new CaptureDao(pool);
export const environmentDao: EnvironmentDao = new EnvironmentDao(pool);
export const environmentInviteDao: EnvironmentInviteDao = new EnvironmentInviteDao(pool);
export const replayDao: ReplayDao = new ReplayDao(pool);
export const sessionDao: SessionDao = new SessionDao(pool);
export const userDao: UserDao = new UserDao(pool);
