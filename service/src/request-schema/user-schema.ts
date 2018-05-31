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

export const newPasswordBody: joi.ObjectSchema = joi.object().keys({
   oldPassword: value.mycrtPassword.required(),
   newPassword: value.mycrtPassword.required(),
   newPasswordAgain: value.mycrtPassword.required(),
});

export const forgotPasswordBody: joi.ObjectSchema = joi.object().keys({
   email: value.email.required(),
});

export const resetPasswordBody: joi.ObjectSchema = joi.object().keys({
   resetToken: joi.string().regex(/[a-f0-9]{200}/i).required(),
   newPassword: value.mycrtPassword.required(),
   newPasswordAgain: value.mycrtPassword.required(),
});
