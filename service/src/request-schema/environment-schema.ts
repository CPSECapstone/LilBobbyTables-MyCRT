import * as joi from 'joi';

import { value } from './common-schema';

export const environmentBody: joi.ObjectSchema = joi.object().keys({
   envName: value.nameString.required(),
   accessKey: value.accessKey.required(),
   secretKey: value.secretKey.required(),
   region: value.region.required(),
   bucket: value.bucket.required(),
   dbName: value.dbName.required(),
   host: value.host.required(),
   user: value.user.required(),
   pass: value.password.required(),
});

export * from './common-schema';
