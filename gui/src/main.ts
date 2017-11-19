import * as path from 'path';

import { Logging } from '@lbt-mycrt/common';

const logger = Logging.defaultLogger(__dirname);

const guiRootDir = path.resolve(__dirname, '..');
export const StaticFileDirs = {
   css: path.resolve(guiRootDir, 'static', 'css'),
   js: path.resolve(guiRootDir, 'static', 'js'),
};

export * from './mustache';
