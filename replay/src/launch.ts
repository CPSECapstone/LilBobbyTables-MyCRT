import { launch as spawn } from '@lbt-mycrt/common/dist/capture-replay/launch';

import { ReplayConfig } from './args';

export const launch = (config: ReplayConfig) => {
   const name = 'mycrt-replay';
   const args = config.toArgList();
   spawn(`replay ${config.id}`, name, args, null);
};
