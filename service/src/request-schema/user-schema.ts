import * as joi from 'joi';

import { value } from './common-schema';

export const signupBody: joi.ObjectSchema = joi.object().keys({
   email: value.email.required(),
   password: value.mycrtPassword.required(),
   agreeToTerms: joi.bool().required(),
});

export const loginBody: joi.ObjectSchema = joi.object().keys({
   email: value.email.required(),
   password: value.mycrtPassword.required(),
});
