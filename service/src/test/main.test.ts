import * as chai from 'chai';
import chaiHttp = require('chai-http');
import { Server } from 'http';
import * as http from 'http-status-codes';
import 'mocha';

import MyCRTService from '../main';

process.env.NODE_ENV = 'test';

const expect = chai.expect;
chai.use(chaiHttp);

describe("MyCRTService", () => {
   let mycrt: MyCRTService;

   beforeEach(() => {
      mycrt = new MyCRTService();
   });

   afterEach(() => {
      mycrt.close();
   });

   it("should launch without crashing", () => {
      mycrt.launch();
   });

   it("should have a Server instance after launching, but not after closing", () => {
      mycrt.launch();
      expect(mycrt.getServer()).to.be.instanceOf(Server);
      mycrt.close();
      const testNull = expect(mycrt.getServer()).to.be.null;
   });

});

describe("MyCRTService GET /", () => {

   let mycrt: MyCRTService;
   before(() => {
      mycrt = new MyCRTService();
      mycrt.launch();
   });

   after(() => {
      mycrt.close();
   });

   it("should return 200", (done) => {
      chai.request(mycrt.getServer()).get('/').then((response) => {
         expect(response).to.have.status(http.OK);
         done();
      });
   });

});
