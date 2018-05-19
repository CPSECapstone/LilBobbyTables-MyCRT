import { OptionDefinition } from 'command-line-args';

import * as captureArgs from '../args';

export const mimicOptions: OptionDefinition[] = captureArgs.captureOptions.concat([
   // Arguments in addition to the capture options
]);

export class MimicConfig extends captureArgs.CaptureConfig {

}
