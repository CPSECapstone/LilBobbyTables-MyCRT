import * as joi from 'joi';

import { value } from './common-schema';

export const slackBody: joi.ObjectSchema = joi.object().keys({
   token: value.token.required(),
   channel: value.channel.required(),
});

export const slackPutBody: joi.ObjectSchema = joi.object().keys({
   token: value.token.optional(),
   channel: value.channel.optional(),
   isOn: value.isOn.optional(),
});

export * from './common-schema';
