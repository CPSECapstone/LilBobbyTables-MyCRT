import { Logging } from '@lbt-mycrt/common';

import express = require('express');
import http = require('http-status-codes');
import joi = require('joi');

const logger = Logging.defaultLogger(__dirname);

// https://medium.com/@skwee357/validating-requests-with-a-simple-middleware-for-express-ed20c5dfd35c

export interface IErrorItem {
   code?: number;
   message: string;
   path?: string[];
}

declare type getThing = (request: express.Request) => any;
declare type setThing = (request: express.Request, thing: any) => void;

const validate = (getter: getThing, setter: setThing, schema: joi.ObjectSchema): express.RequestHandler => {
   return (request: express.Request, response: express.Response, next: express.NextFunction) => {

      joi.validate(getter(request), schema, {
         abortEarly: false,
         allowUnknown: true,
         skipFunctions: true,
         stripUnknown: true,
      }, (err: joi.ValidationError, value: any) => {

         if (err) {
            const details: IErrorItem[] = [];
            err.details.forEach((item: joi.ValidationErrorItem) => {
               logger.error(`${item.path}: ${item.message}`);
               details.push({
                  message: item.message,
                  path: item.path,
               });
            });
            response.status(http.BAD_REQUEST).json(details);
            return;
         }

         setter(request, value);
         next();

      });

   };
};

export const validBody = (schema: joi.ObjectSchema): express.RequestHandler => {
   return validate((request) => request.body, (request, thing) => { request.body = thing; }, schema);
};

export const validQuery = (schema: joi.ObjectSchema): express.RequestHandler => {
   return validate((request) => request.query, (request, thing) => { request.query = thing; }, schema);
};

export const validParams = (schema: joi.ObjectSchema): express.RequestHandler => {
   return validate((request) => request.params, (request, thing) => { request.params = thing; }, schema);
};
