import * as joi from 'joi';

import { value } from './common-schema';

export const inviteBody: joi.ObjectSchema = joi.object().keys({
   environmentId: value.id.required(),
   userEmail: value.email.required(),
});

export const acceptBody: joi.ObjectSchema = joi.object().keys({
   inviteCode: joi.string().regex(/[a-f0-9]{8}/i).required(),
});
