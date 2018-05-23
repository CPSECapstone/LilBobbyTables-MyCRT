import { launch as spawn } from '@lbt-mycrt/common/dist/capture-replay/launch';

import { MimicConfig } from "./args";

export const launch = (config: MimicConfig) => {
   const name = 'mycrt-mimic';
   const args = config.toArgList();
   spawn(`mimic ${config.id}`, name, args);
};
