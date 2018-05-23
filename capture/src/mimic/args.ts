import * as readCmdArgs from 'command-line-args';

import * as captureArgs from '../args';

export interface OptionDefinition extends readCmdArgs.OptionDefinition {
   description?: string;
}

export const optionReplayId: OptionDefinition = {
   name: 'replayIds',
   type: Number,
   alias: 'r',
   multiple: true,
   description: "An ID of a replay to mimic the capture",
};

export const mimicOptions: OptionDefinition[] = captureArgs.captureOptions.concat([
   optionReplayId,
]);

export class MimicConfig extends captureArgs.CaptureConfig {

   public static fromCmdArgs(): MimicConfig {
      const options = readCmdArgs(mimicOptions);
      if (!options.id) {
         throw new Error("No id was provided for the mimic");
      }
      if (!options.envId) {
         throw new Error("No envId was provided for the mimic");
      }
      if (!options.replayIds || !Array.isArray(options.replayIds)) {
         throw new Error("No replay Ids were provided");
      }

      const config = new MimicConfig(options.id, options.envId, options.replayIds);
      config.mock = options.mock;
      config.interval = options.interval;
      config.intervalOverlap = options.intervalOverlap;
      config.metricsDelay = options.metricsDelay;
      config.filePrepDelay = options.filePrepDelay;
      config.supervised = options.supervised;

      return config;
   }

   public replayIds: number[];

   constructor(id: number, envId: number, replayIds: number[]) {
      super(id, envId);
      this.replayIds = replayIds;
   }

   protected getOptionsMap(): Array<[OptionDefinition, any]> {
      const captureOptionsMap = super.getOptionsMap();
      return captureOptionsMap.concat([
         [optionReplayId, this.replayIds],
      ]);
   }
}
