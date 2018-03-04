import * as joi from 'joi';

import { value } from './common-schema';

export const captureValue = {
   status: joi.string().regex(/^(?:scheduled|starting|started)?$/i).uppercase(),
   timestamp: joi.date(),
};

export const captureBody: joi.ObjectSchema = joi.object().keys({
   name: value.nameString.required(),
   envId: value.envId.required(),
   status: captureValue.status.optional(),
   start: captureValue.timestamp.optional(),
   scheduledStart: captureValue.timestamp.optional(),
});

export const envQuery: joi.ObjectSchema = joi.object().keys({
    environmentId: value.envId.optional(),
});

export * from './common-schema';
