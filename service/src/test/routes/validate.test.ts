import { expect, request } from 'chai';
import * as http from 'http-status-codes';
import 'mocha';

import MyCrtService from '../../main';
import { badCredBody, badDBBody } from './data';

export const validateTests = (mycrt: MyCrtService) => () => {

   it("should reject incomplete credentials body for rds", async () => {
      try {
         const response = await request(mycrt.getServer()).post('/api/validate/credentials').send(badCredBody);
      } catch (err) {
         expect(err).to.have.status(http.BAD_REQUEST);
      }
   });

   it("should reject incomplete credentials body for s3", async () => {
      try {
         const response = await request(mycrt.getServer()).post('/api/validate/bucket');
      } catch (err) {
         expect(err).to.have.status(http.BAD_REQUEST);
      }
   });

   it("should reject incomplete database body", async () => {
      try {
         const response = await request(mycrt.getServer()).post('/api/validate/database');
      } catch (err) {
         expect(err).to.have.status(http.BAD_REQUEST);
      }
   });
};
