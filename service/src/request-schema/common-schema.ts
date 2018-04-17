import * as joi from 'joi';

export const value = {

   /** A number suitable for an id (strings are converted to numbers) */
   id: joi.number(),

   /** A string suitable to name an entity. Restrict to only a few special characters */
   nameString: joi.string().regex(/^[a-zA-Z0-9 :_\-]{4,}$/),

   /** A string that, when converted to uppercase, matches a MetricType value */
   metricType: joi.string().regex(/^(?:cpu|read|write|memory)?$/i).uppercase(),

   /** A string that can be used as an access key */
   // TODO: verify this pattern
   accessKey: joi.string().regex(/^[A-Z0-9]+$/),

   /** A string that can be used as a secret key */
   // TODO: verify this pattern
   secretKey: joi.string().regex(/^\S+$/),

   /** An AWS region */
   region: joi.string().regex(/^[a-z]{2}\-[a-z]{4,12}\-[0-9]+$/i).lowercase(),

   /** An S3 bucket */
   // https://docs.aws.amazon.com/AmazonS3/latest/dev/BucketRestrictions.html#bucketnamingrules
   bucket: joi.string().regex(/^[a-z0-9][a-z0-9\.\-]{1,61}[a-z0-9]$/),

   /** A database name */
   // https://dev.mysql.com/doc/refman/5.7/en/identifiers.html
   dbName: joi.string().regex(/^[0-9a-zA-Z\$_]+$/).max(64),

   /** Valid Hostname */
   // https://stackoverflow.com/questions/106179/regular-expression-to-match-dns-hostname-or-ip-address
   host: joi.string().regex(/^(([a-z0-9]|[a-z0-9][a-z0-9\-]*[a-z0-9])\.)*([a-z0-9]|[a-z0-9][a-z0-9\-]*[a-z0-9])$/i),

   // TODO
   user: joi.string(),

   // TODO
   password: joi.string(),

   /** A boolean value */
   deleteLog: joi.boolean(),

   // TODO
   // Must start with a letter and only contain letters, digits, or hyphens (NO CONSECUTIVE HYPENS)
   parameterGroup: joi.string(),

   envId: joi.number(),

   dbId: joi.number(),

   // TODO
   instance: joi.string(),

};

export const idParams: joi.ObjectSchema = joi.object().keys({
   id: value.id.required(),
});

export const metricTypeQuery: joi.ObjectSchema = joi.object().keys({
   type: value.metricType.optional(),
});

export const deleteLogsQuery: joi.ObjectSchema = joi.object().keys({
    deleteLogs: value.deleteLog.optional(),
});
