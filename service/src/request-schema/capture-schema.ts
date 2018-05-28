import * as joi from 'joi';

import { value } from './common-schema';

export const captureValue = {
   status: joi.string().regex(/^(?:scheduled|starting|started)?$/i).uppercase(),
   timestamp: joi.date(),
   duration: joi.number(),
};

export const captureBody: joi.ObjectSchema = joi.object().keys({
   name: value.nameString.required(),
   envId: value.envId.required(),
   status: captureValue.status.optional(),
   start: captureValue.timestamp.optional(),
   scheduledStart: captureValue.timestamp.optional(),
   duration: captureValue.duration.optional(),
});

export const mimicBody: joi.ObjectSchema = joi.object().keys({
   envId: value.envId.required(),
   name: value.nameString.required(),
   status: joi.string().regex(/^SCHEDULED$/).uppercase(),
   scheduledStart: captureValue.timestamp.optional(),
   duration: captureValue.duration.optional(),
   replays: joi.array().items(joi.object().keys({
      name: value.nameString.required(),
      dbName: value.dbName.required(),
      host: value.host.required(),
      user: value.user.required(),
      pass: value.password.required(),
      instance: value.instance.required(),
      parameterGroup: value.parameterGroup.required(),
   }).required()).min(1).max(5).required(),
}).with('status', 'scheduledStart');

export const capQuery: joi.ObjectSchema = joi.object().keys({
   envId: value.envId.optional(),
   name: value.nameString.optional(),
});

export const putCaptureBody: joi.ObjectSchema = joi.object().keys({
   name: value.nameString.optional(),
});

export * from './common-schema';
