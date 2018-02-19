import { launch as spawn } from '@lbt-mycrt/common/dist/capture-replay/launch';

import { CaptureConfig } from './args';

export const launch = (config: CaptureConfig) => {
   const name = 'mycrt-capture';
   const args = config.toArgList();
   spawn(`capture ${config.id}`, name, args, config.env);
};
