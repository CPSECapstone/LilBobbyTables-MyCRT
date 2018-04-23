import { expect } from 'chai';
import * as http from 'http-status-codes';
import 'mocha';

import { MyCrtServiceTestClient } from "./mycrt";

export const userTests = (mycrt: MyCrtServiceTestClient) => function() {

   it("should post a user", async function() {
      const response = await mycrt.post(http.OK, '/api/users/signup');
      expect(response.body.id).to.equal(1);
      expect(response.body.isAdmin).to.be.false;
   });

};
