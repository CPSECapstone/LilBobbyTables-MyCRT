import * as joi from 'joi';

import { value } from './common-schema';

// placeholder for now. probably going to change this to a cognito identifier of some sort
export const loginBody: joi.ObjectSchema = joi.object().keys({
   id: value.id.required(),
});
