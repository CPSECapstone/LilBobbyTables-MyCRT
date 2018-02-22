import * as joi from 'joi';

import { value } from './common-schema';

export const replayBody: joi.ObjectSchema = joi.object().keys({
   name: value.nameString.required(),
   captureId: value.id.required(),
   envId: value.envId.required(),
});

export * from './common-schema';
