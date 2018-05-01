import * as joi from 'joi';

import { value } from './common-schema';

export const environmentBody: joi.ObjectSchema = joi.object().keys({
   envName: value.nameString.required(),
   accessKey: value.accessKey.required(),
   secretKey: value.secretKey.required(),
   region: value.region.required(),
   keysName: value.nameString.optional(),
   bucket: value.bucket.required(),
   dbName: value.dbName.required(),
   host: value.host.required(),
   user: value.user.required(),
   pass: value.password.required(),
   instance: value.instance.required(),
   parameterGroup: value.parameterGroup.optional(),
});

export const envNameQuery: joi.ObjectSchema = joi.object().keys({
   name: value.nameString.optional(),
});

export * from './common-schema';
