import * as joi from 'joi';

import { value } from './common-schema';

export const credentialsNameBody: joi.ObjectSchema = joi.object().keys({
   keysName: value.nameString.required(),
});

export const credentialsBody: joi.ObjectSchema = joi.object().keys({
   accessKey: value.accessKey.required(),
   secretKey: value.secretKey.required(),
   region: value.region.required(),
   keysName: value.nameString.optional(),
});

export const databaseBody: joi.ObjectSchema = joi.object().keys({
   dbName: value.dbName.required(),
   host: value.host.required(),
   user: value.user.required(),
   pass: value.password.required(),
});

export const environmentNameBody: joi.ObjectSchema = joi.object().keys({
   name: value.nameString.required(),
});

export const bucketQuery: joi.ObjectSchema = joi.object().keys({
   envId: value.id.required(),
});

export const bucketMetricsQuery: joi.ObjectSchema = joi.object().keys({
   envId: value.id.required(),
   id: value.id.required(),
   type: joi.string().regex(/^(?:capture|replay)$/).required(),
});

export const bucketWorkloadQuery: joi.ObjectSchema = joi.object().keys({
   envId: value.id.required(),
   id: value.id.required(),
});
