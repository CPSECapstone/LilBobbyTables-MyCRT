import { expect, request } from 'chai';
import * as http from 'http-status-codes';
import 'mocha';

import { Logging } from '@lbt-mycrt/common/dist/main';
import MyCrtService from '../../main';

const newEnvBody = {
   accessKey: "ACCESSKEY",
   secretKey: "SECRETKEY",
   region: "us-east-2",
   bucket: "nfllogbucket",
   dbName: "NFL",
   host: "nfl2015.c7m7t1xyrt7v.us-east-2.rds.amazonaws.com",
   user: "nfl2015user",
   pass: "nfl2015pass",
   envName: "NFL environment",
   instance: "nfl2015",
   parameterGroup: "supergroup",
};

const badEnvBody = {
   accessKey: "ACCESSKEY",
   secretKey: "SECRETKEY",
   region: "somewhereineastasia",
   bucket: "nfllogbucket",
   dbName: "NFL",
   host: "nfl2015.c7m7t1xyrt7v.us-east-2.rds.amazonaws.com",
   user: "nfl2015user",
   pass: "nfl2015pass",
   envName: "NFL environment",
   instance: "nfl2015",
   parameterGroup: "supergroup",
};

const editEnvBody = {
   accessKey: "ACCESSKEY",
   secretKey: "SECRETKEY",
   region: "us-east-2",
   bucket: "nfllogbucket",
   dbName: "NFL",
   host: "nfl2015.c7m7t1xyrt7v.us-east-2.rds.amazonaws.com",
   user: "nfl2015user",
   pass: "nfl2015pass",
   envName: "NFL sequel",
   instance: "nfl2015",
   parameterGroup: "supergroup",
};

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
      const response = await request(mycrt.getServer()).put('/api/environments/1').send(editEnvBody);
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

   it("should not find environment a nonexisting environment", async () => {
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
