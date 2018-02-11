import * as joi from 'joi';

export { idParams, metricTypeQuery } from './common-schema';

export const captureBody: joi.ObjectSchema = joi.object().keys({
   name: joi.string().regex(/^[a-zA-Z0-9 :_\-]{4,}$/).required(),
});
