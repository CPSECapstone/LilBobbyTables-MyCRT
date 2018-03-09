import { expect, request } from 'chai';
import * as http from 'http-status-codes';
import 'mocha';

import MyCrtService from '../../main';
import { newEnvBody } from './data';

export const dbReferenceTests = (mycrt: MyCrtService) => () => {
   it("should get a db reference", async () => {
      const responsePost = await request(mycrt.getServer()).post('/api/environments/').send(newEnvBody);
      const id = responsePost.body.id;
      const response = await request(mycrt.getServer()).get('/api/dbReferences/' + id);
      expect(response).to.have.status(http.OK);
      // TODO test the body of the response
   });

   it("should not find a nonexisting db reference", async () => {
      try {
         const response = await request(mycrt.getServer()).get('/api/environments/42');
      } catch (err) {
         expect(err).to.have.status(http.NOT_FOUND);
      }
   });
};
