import * as readCmdArgs from 'command-line-args';
import { OptionDefinition } from 'command-line-args';

import { Config } from '@lbt-mycrt/common/dist/capture-replay/args';

// command-line-args documentation here
// https://github.com/75lb/command-line-args
//
// notation rules documented here
// https://github.com/75lb/command-line-args/wiki/Notation-rules

export const optionId: OptionDefinition = {
   name: 'id',
   type: Number,
   description: "The id of this replay, used to communicate with the MyCRT DB and S3 [bold]{REQUIRED}",
};

export const optionCaptureId: OptionDefinition = {
   name: 'captureId',
   type: Number,
   description: "The id of the associated capture that is being replayed [bold]{REQUIRED}",
};

export const optionDbId: OptionDefinition = {
   name: 'dbId',
   type: Number,
   description: "The id of the associated database of this replay",
};

export const optionDbId: OptionDefinition = {
   name: 'dbId',
   type: Number,
   description: "The id of the target database upon which to perform the replay",
};

export const optionMock: OptionDefinition = {
   name: 'mock',
   alias: 'm',
   type: Boolean,
   defaultValue: false,
   description: "Whether or not the replay should be performed as a mock",
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
   description: "Whether or not this replay is supervised by the MyCRT service",
};

export const replayOptions: OptionDefinition[] = [optionId, optionCaptureId, optionDbId, optionMock, optionInterval,
   optionIntervalOverlap, optionSupervised];

export class ReplayConfig extends Config {

   public static fromCmdArgs(): ReplayConfig {

      const options = readCmdArgs(replayOptions);
      if (!options.id) {
         throw new Error("No id was provided for the replay");
      }
      if (!options.captureId) {
         throw new Error("No captureId was provided for the replay");
      }
      if (!options.dbId) {
         throw new Error("No dbId was provided for the replay");
      }
      if (!options.dbId) {
         throw new Error("No dbId was provided for the replay");
      }

      const config = new ReplayConfig(options.id, options.captureId, options.dbId);
      config.mock = options.mock;
      config.interval = options.interval;
      config.intervalOverlap = options.intervalOverlap;
      config.supervised = options.supervised;

      return config;
   }

   public id: number;
   public captureId: number;
   public dbId: number;
   public mock: boolean = optionMock.defaultValue;
   public interval: number = optionInterval.defaultValue;
   public intervalOverlap: number = optionIntervalOverlap.defaultValue;
   public supervised: boolean = optionSupervised.defaultValue;

   constructor(id: number, captureId: number, dbId: number) {
      super();
      this.id = id;
      this.captureId = captureId;
      this.dbId = dbId;
   }

   protected getOptionsMap(): Array<[OptionDefinition, any]> {
      return [
         [optionId, this.id],
         [optionCaptureId, this.captureId],
         [optionDbId, this.dbId],
         [optionMock, this.mock],
         [optionInterval, this.interval],
         [optionIntervalOverlap, this.intervalOverlap],
         [optionSupervised, this.supervised],
      ];
   }

}
