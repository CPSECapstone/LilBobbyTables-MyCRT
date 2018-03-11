import { expect, request } from 'chai';
import * as http from 'http-status-codes';
import 'mocha';

import { badEnvBody, editEnvBody, newEnvBody} from './data';
import { MyCrtServiceTestClient } from './mycrt';

export const environmentTests = (mycrt: MyCrtServiceTestClient) => () => {

   it("should post an environment", async () => {
      const response = await mycrt.post(http.OK, '/api/environments/', newEnvBody);
      expect(response.body.id).to.equal(1);
   });

   it("should reject the post of environment", async () => {
      const response = await mycrt.post(http.BAD_REQUEST, '/api/environments/', badEnvBody);
   });

   it("should edit an environment", async () => {
      const responsePost = await mycrt.post(http.OK, '/api/environments/', newEnvBody);
      const id = responsePost.body.id;
      const response = await mycrt.put(http.OK, '/api/environments/' + id, editEnvBody);
      expect(response.body.changedRows).to.equal(1);
   });

   it("should reject the edit of environment", async () => {
      const responsePost = await mycrt.post(http.OK, '/api/environments/', newEnvBody);
      const response = await mycrt.put(http.BAD_REQUEST, '/api/environments/1', badEnvBody);
   });

   it("should get all environments", async () => {
      const responsePost1 = await mycrt.post(http.OK, '/api/environments/', newEnvBody);
      const responsePost2 = await mycrt.post(http.OK, '/api/environments/', newEnvBody);
      const response = await mycrt.get(http.OK, '/api/environments');
      expect(response.body.length).to.equal(2);
   });

   it("should get environment 1", async () => {
      const responsePost = await mycrt.post(http.OK, '/api/environments/', newEnvBody);
      const response = await mycrt.get(http.OK, '/api/environments/1');
      expect(response.body.dbName).equals("NFL");
   });

   it("should not find a nonexisting environment", async () => {
      const response = await mycrt.get(http.NOT_FOUND, '/api/environments/42');
   });

   it("should delete an environment", async () => {
      const responsePost = await mycrt.post(http.OK, '/api/environments/', newEnvBody);
      const response = await mycrt.delete(http.OK, '/api/environments/1');
      expect(response.body.affectedRows).to.equal(1);
   });

   it("should not delete a nonexisting environment", async () => {
      const response = await mycrt.delete(http.NOT_FOUND, '/api/environments/42');
   });
};
