import * as joi from 'joi';

export const idParams: joi.ObjectSchema = joi.object().keys({
   id: joi.number().required(),
});

export const metricTypeQuery: joi.ObjectSchema = joi.object().keys({
   type: joi.string().regex(/^(?:cpu|io|memory)?$/i).uppercase().optional(),
});
