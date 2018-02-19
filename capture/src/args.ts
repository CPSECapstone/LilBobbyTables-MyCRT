import * as readCmdArgs from 'command-line-args';
import { OptionDefinition } from 'command-line-args';

import { Config } from '@lbt-mycrt/common/dist/capture-replay/args';
import { IEnvironmentFull } from '@lbt-mycrt/common/dist/data';

// command-line-args documentation here
// https://github.com/75lb/command-line-args
//
// notation rules documented here
// https://github.com/75lb/command-line-args/wiki/Notation-rules

export const optionId: OptionDefinition = {
   name: 'id',
   type: Number,
   description: "The id of this capture, used to communicate with the MyCRT DB and S3 [bold]{REQUIRED}",
};

export const optionMock: OptionDefinition = {
   name: 'mock',
   alias: 'm',
   type: Boolean,
   defaultValue: false,
   description: "Whether or not the capture should be performed as a mock",
};

export const optionInterval: OptionDefinition = {
   name: 'interval',
   alias: 'i',
   type: Number,
   defaultValue: 5 * 60 * 1000,
   description: "Frequency of the processing interval in ms.",
};

export const optionIntervalOverlap: OptionDefinition = {
   name: 'intervalOverlap',
   alias: 'o',
   type: Number,
   defaultValue: 1 * 60 * 1000,
   description: "The amount of overlap time between metric retrievals.",
};

export const optionSupervised: OptionDefinition = {
   name: 'supervised',
   alias: 's',
   type: Boolean,
   defaultValue: true,
   description: "Whether or not this capture is supervised by the MyCRT service",
};

export const captureOptions: OptionDefinition[] = [optionId, optionMock, optionInterval,
   optionIntervalOverlap, optionSupervised];

export class CaptureConfig extends Config {

   public static fromCmdArgs(): CaptureConfig {

      const options = readCmdArgs(captureOptions);
      if (!options.id) {
         throw new Error("No id was provided for the capture");
      }

      const config = new CaptureConfig(options.id);
      config.mock = options.mock;
      config.interval = options.interval;
      config.intervalOverlap = options.intervalOverlap;
      config.supervised = options.supervised;

      return config;
   }

   public id: number;
   public mock: boolean = optionMock.defaultValue;
   public interval: number = optionInterval.defaultValue;
   public intervalOverlap: number = optionIntervalOverlap.defaultValue;
   public supervised: boolean = optionSupervised.defaultValue;

   constructor(id: number) {
      super();
      this.id = id;
   }

   protected getOptionsMap(): Array<[OptionDefinition, any]> {
      return [
         [optionId, this.id],
         [optionMock, this.mock],
         [optionInterval, this.interval],
         [optionIntervalOverlap, this.intervalOverlap],
         [optionSupervised, this.supervised],
      ];
   }
}
