import * as joi from 'joi';

import { value } from './common-schema';

export const replayValue = {
   status: joi.string().regex(/^(?:scheduled)?$/i).uppercase(),
   timestamp: joi.date(),
   duration: joi.number(),
};

export const replayBody: joi.ObjectSchema = joi.object().keys({
   name: value.nameString.required(),
   captureId: value.id.required(),
   dbName: value.dbName.required(),
   host: value.host.required(),
   user: value.user.required(),
   pass: value.password.required(),
   instance: value.instance.required(),
   parameterGroup: value.parameterGroup.required(),
   scheduledStart: replayValue.timestamp.optional(),
   status: replayValue.status.optional(),
   start: replayValue.timestamp.optional(),
});

export const replayValues = {
    captureId: joi.number(),
};

export const replayQuery: joi.ObjectSchema = joi.object().keys({
    captureId: replayValues.captureId.optional(),
    name: value.nameString.optional(),
});

export const putReplayBody: joi.ObjectSchema = joi.object().keys({
   name: value.nameString.optional(),
});

export * from './common-schema';
