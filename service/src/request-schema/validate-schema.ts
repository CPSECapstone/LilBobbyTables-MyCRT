import * as joi from 'joi';

import { value } from './common-schema';

export const credentialsBody: joi.ObjectSchema = joi.object().keys({
   accessKey: value.accessKey.required(),
   secretKey: value.secretKey.required(),
   region: value.region.required(),
});

export const databaseBody: joi.ObjectSchema = joi.object().keys({
   dbName: value.dbName.required(),
   host: value.host.required(),
   user: value.user.required(),
   pass: value.password.required(),
});
