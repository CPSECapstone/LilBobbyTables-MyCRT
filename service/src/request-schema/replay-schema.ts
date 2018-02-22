import * as joi from 'joi';

import { value } from './common-schema';

export const replayBody: joi.ObjectSchema = joi.object().keys({
   name: value.nameString.required(),
   captureId: value.id.required(),
   envId: value.envId.required(),
});

export const replayValues = {
    captureId: joi.number(),
};

export const replayQuery: joi.ObjectSchema = joi.object().keys({
    captureId: replayValues.captureId.optional(),
});

export * from './common-schema';
