import * as joi from 'joi';

import { value } from './common-schema';

export const captureBody: joi.ObjectSchema = joi.object().keys({
   name: value.nameString.required(),
   envId: value.envId.required(),
});

export * from './common-schema';
