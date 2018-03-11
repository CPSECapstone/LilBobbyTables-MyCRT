import { expect, request } from 'chai';
import * as http from 'http-status-codes';
import 'mocha';

import { badCredBody, badDBBody } from './data';
import { MyCrtServiceTestClient } from './mycrt';

export const validateTests = (mycrt: MyCrtServiceTestClient) => () => {

   it("should reject incomplete credentials body for rds", async () => {
      const response = await mycrt.post(http.BAD_REQUEST, '/api/validate/credentials', badCredBody);
   });

   it("should reject incomplete credentials body for s3", async () => {
      const response = await mycrt.post(http.BAD_REQUEST, '/api/validate/bucket');
   });

   it("should reject incomplete database body", async () => {
      const response = await mycrt.post(http.BAD_REQUEST, '/api/validate/database');
   });
};
