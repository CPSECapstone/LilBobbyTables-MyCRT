import { expect, request } from 'chai';
import * as http from 'http-status-codes';
import 'mocha';

import MyCrtService from '../../main';
import { badEnvBody, editEnvBody, newEnvBody} from './data';

export const environmentTests = (mycrt: MyCrtService) => () => {

   it("should post an environment", async () => {
      const response = await request(mycrt.getServer()).post('/api/environments/').send(newEnvBody);
      expect(response).to.have.status(http.OK);
      expect(response.body.id).to.equal(1);
   });

   it("should reject the post of environment", async () => {
      try {
         const response = await request(mycrt.getServer()).post('/api/environments/').send(badEnvBody);
      } catch (err) {
         expect(err).to.have.status(http.BAD_REQUEST);
      }
   });

   it("should edit an environment", async () => {
      const responsePost = await request(mycrt.getServer()).post('/api/environments/').send(newEnvBody);
      const id = responsePost.body.id;
      const response = await request(mycrt.getServer()).put('/api/environments/' + id).send(editEnvBody);
      expect(response).to.have.status(http.OK);
      expect(response.body.changedRows).to.equal(1);
   });

   it("should reject the edit of environment", async () => {
      try {
         const responsePost = await request(mycrt.getServer()).post('/api/environments/').send(newEnvBody);
         const response = await request(mycrt.getServer()).put('/api/environments/1').send(badEnvBody);
      } catch (err) {
         expect(err).to.have.status(http.BAD_REQUEST);
      }
   });

   it("should get all environments", async () => {
      const responsePost1 = await request(mycrt.getServer()).post('/api/environments/').send(newEnvBody);
      const responsePost2 = await request(mycrt.getServer()).post('/api/environments/').send(newEnvBody);
      const response = await request(mycrt.getServer()).get('/api/environments');
      expect(response).to.have.status(http.OK);
      expect(response.body.length).to.equal(2);
   });

   it("should get environment 1", async () => {
      const responsePost = await request(mycrt.getServer()).post('/api/environments/').send(newEnvBody);
      const response = await request(mycrt.getServer()).get('/api/environments/1');
      expect(response).to.have.status(http.OK);
      expect(response.body.dbName).equals("NFL");
   });

   it("should not find a nonexisting environment", async () => {
      try {
         const response = await request(mycrt.getServer()).get('/api/environments/42');
      } catch (err) {
         expect(err).to.have.status(http.NOT_FOUND);
      }
   });

   it("should delete an environment", async () => {
      const responsePost = await request(mycrt.getServer()).post('/api/environments/').send(newEnvBody);
      const response = await request(mycrt.getServer()).del('/api/environments/1');
      expect(response).to.have.status(http.OK);
      expect(response.body.affectedRows).to.equal(1);
   });

   it("should not delete a nonexisting environment", async () => {
      try {
         const response = await request(mycrt.getServer()).del('/api/environments/42');
      } catch (err) {
         expect(err).to.have.status(http.NOT_FOUND);
      }
   });
};
