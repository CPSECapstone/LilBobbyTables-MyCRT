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

export const putEnvironmentBody: joi.ObjectSchema = joi.object().keys({
   envName: value.nameString.optional(),

   accessKey: value.accessKey.optional(),
   secretKey: value.secretKey.optional(),
   region: value.region.optional(),
   keysName: value.nameString.optional(),

   awsKeysId: value.awsKeysId.optional(),

   dbName: value.dbName.optional(),
   host: value.host.optional(),
   user: value.user.optional(),
   pass: value.password.optional(),
   instance: value.instance.optional(),
   parameterGroup: value.parameterGroup.optional(),

   dbId: value.dbId.optional(),
}).and('accessKey', 'secretKey', 'region', 'keysName')
.without('awsKeysId', 'accessKey')
.and('dbName', 'host', 'user', 'pass', 'instance', 'parameterGroup')
.without('dbId', 'dbName');

export * from './common-schema';
