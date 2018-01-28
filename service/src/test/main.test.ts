import * as chai from 'chai';
import chaiHttp = require('chai-http');
import { Server } from 'http';
import * as http from 'http-status-codes';
import 'mocha';

import MyCrtService from '../main';

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

   it("should return 200 on '/'", (done) => {
      chai.request(mycrt.getServer()).get('/').then((response) => {
         expect(response).to.have.status(http.OK);
         done();
      });
   });

});
