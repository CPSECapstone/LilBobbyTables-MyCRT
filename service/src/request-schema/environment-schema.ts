import * as joi from 'joi';

import { value } from './common-schema';

export const environmentBody: joi.ObjectSchema = joi.object().keys({
   envName: value.nameString.required(),
   accessKey: value.accessKey.required(),
   secretKey: value.secretKey.required(),
   region: value.region.required(),
   keysId: value.keysId.optional(),
   keysName: value.nameString.optional(),
   bucket: value.bucket.required(),
   prefix: value.prefix.optional(),
   dbName: value.dbName.required(),
   host: value.host.required(),
   user: value.user.required(),
   pass: value.password.required(),
   instance: value.instance.required(),
   parameterGroup: value.parameterGroup.optional(),
});

export * from './common-schema';
