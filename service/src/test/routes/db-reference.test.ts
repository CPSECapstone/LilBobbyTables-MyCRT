import { expect, request } from 'chai';
import * as http from 'http-status-codes';
import 'mocha';

import { newEnvBody } from './data';
import { MyCrtServiceTestClient } from './mycrt';

export const dbReferenceTests = (mycrt: MyCrtServiceTestClient) => function() {
   it("should get a db reference", async function() {
      const responsePost = await mycrt.post(http.OK, '/api/environments/', newEnvBody);
      const id = responsePost.body.id;
      const response = await mycrt.get(http.OK, '/api/dbReferences/' + id);
      // TODO test the body of the response
   });

   it("should not find a nonexisting db reference", async function() {
      const response = await mycrt.get(http.NOT_FOUND, '/api/environments/42');
   });
};
