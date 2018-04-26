import * as chai from 'chai';
import chaiHttp = require('chai-http');
import { Server } from 'http';
import * as http from 'http-status-codes';
import 'mocha';

import { utils } from '@lbt-mycrt/common';

import { captureDao, environmentDao, replayDao, userDao } from '../dao/mycrt-dao';
import MyCrtService from '../main';

import { indexTests } from './index.test';
import { captureTests } from './routes/captures.test';
import { dbReferenceTests } from './routes/db-reference.test';
import { environmentTests } from './routes/environment.test';
import { MyCrtServiceTestClient } from './routes/mycrt';
import { replayTests } from './routes/replay.test';
import { validateTests } from './routes/validate.test';

const expect = chai.expect;
chai.use(chaiHttp);

export const mycrt: MyCrtService = new MyCrtService();

export const launchMyCrtService = async function() {
   // launch
   expect(await mycrt.launch().catch((reason) => {
      chai.assert.fail(`mycrt launch failed: ${reason}`);
   })).to.be.true;
   expect(mycrt.getServer()).to.be.instanceOf(Server);
   expect(mycrt.isLaunched()).to.be.true;
};

export const closeMyCrtService = async function() {
   expect(await mycrt.close().catch((reason) => {
      chai.assert.fail(`mycrt close failed: ${reason}`);
   })).to.be.true;
   expect(mycrt.getServer()).to.be.null;
   expect(mycrt.isLaunched()).to.be.false;
};

export const signupAndLogin = (client: MyCrtServiceTestClient) => async function() {

   await userDao.nuke();
   await utils.sleep(1500);

   const signupResponse = await client.post(http.OK, '/api/users/signup', {
      email: "test@gmail.com",
      password: "thisisthetestpassword",
      agreeToTerms: true,
   });
   expect(signupResponse.body.id).to.equal(1);
   expect(signupResponse.body.isAdmin).to.be.false;

   const loginResponse = await client.post(http.OK, '/api/users/login', {
      email: "test@gmail.com",
      password: "thisisthetestpassword",
   });
   expect(loginResponse.body.id).to.equal(signupResponse.body.id);

   client.user = loginResponse.body;

};

describe("MyCrtService", function() {

   const client = new MyCrtServiceTestClient(mycrt);

   before(launchMyCrtService);
   before(signupAndLogin(client));
   after(closeMyCrtService);

   // TODO: change the service tests to work on a different DB
   // currently, this wipes a developer's database, which is anoying.
   beforeEach(async function() {
      this.timeout(10000);
      await replayDao.nuke();
      await captureDao.nuke();
      await environmentDao.nuke();
      await utils.sleep(1500);
   });

   it("should return 200 on '/'", async function() {
      const response = await chai.request(mycrt.getServer()).get('/');
      expect(response).to.have.status(http.OK);
   });

   describe("site index", indexTests(client));
   describe("environment router", environmentTests(client));
   describe("capture router", captureTests(client));
   describe("replay router", replayTests(client));
   describe("validate router", validateTests(client));
   describe("dbReference router", dbReferenceTests(client));

});
