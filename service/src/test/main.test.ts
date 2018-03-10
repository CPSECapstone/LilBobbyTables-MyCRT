import * as chai from 'chai';
import chaiHttp = require('chai-http');
import { Server } from 'http';
import * as http from 'http-status-codes';
import 'mocha';

import { captureDao, environmentDao, replayDao } from '../dao/mycrt-dao';
import MyCrtService from '../main';

import { captureTests } from './routes/captures.test';
import { dbReferenceTests } from './routes/db-reference.test';
import { environmentTests } from './routes/environment.test';
import { MyCrtServiceTestClient } from './routes/mycrt';
import { replayTests } from './routes/replay.test';
import { validateTests } from './routes/validate.test';

const expect = chai.expect;
chai.use(chaiHttp);

export const mycrt: MyCrtService = new MyCrtService();

export const launchMyCrtService = async () => {
   expect(await mycrt.launch().catch((reason) => {
      chai.assert.fail(`mycrt launch failed: ${reason}`);
   })).to.be.true;
   expect(mycrt.getServer()).to.be.instanceOf(Server);
   expect(mycrt.isLaunched()).to.be.true;
};

export const closeMyCrtService = async () => {
   expect(await mycrt.close().catch((reason) => {
      chai.assert.fail(`mycrt close failed: ${reason}`);
   })).to.be.true;
   expect(mycrt.getServer()).to.be.null;
   expect(mycrt.isLaunched()).to.be.false;
};

describe("MyCrtService", () => {

   before(launchMyCrtService);
   after(closeMyCrtService);

   // TODO: change the service tests to work on a different DB
   // currently, this wipes a developer's database, which is anoying.
   beforeEach(async () => {
      await replayDao.nuke();
      await captureDao.nuke();
      await environmentDao.nuke();
   });

   afterEach((done) => {
      setTimeout(done, 150);
   });

   it("should return 200 on '/'", async () => {
      const response = await chai.request(mycrt.getServer()).get('/');
      expect(response).to.have.status(http.OK);
   });

   const client = new MyCrtServiceTestClient(mycrt, 100);
   describe("environment router", environmentTests(client));
   describe("capture router", captureTests(client));
   describe("replay router", replayTests(client));
   describe("validate router", validateTests(client));
   describe("dbReference router", dbReferenceTests(client));

});
