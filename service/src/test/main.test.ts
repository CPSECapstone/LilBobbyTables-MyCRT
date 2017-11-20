import * as chai from 'chai';
import chaiHttp = require('chai-http');
import { Server } from 'http';
import * as http from 'http-status-codes';
import 'mocha';

import MyCRTService from '../main';

const expect = chai.expect;
chai.use(chaiHttp);

/* tslint:disable no-unused-expression */

describe("MyCRTService", () => {

   // it("should have a Server instance after launching, but not after closing", () => {
   //    const mycrt: MyCRTService = new MyCRTService();
   //    mycrt.launch();
   //    expect(mycrt.getServer()).to.be.instanceOf(Server);
   //    expect(mycrt.isLaunched()).to.be.true;
   //    mycrt.close();
   //    expect(mycrt.getServer()).to.be.null;
   //    expect(mycrt.isLaunched()).to.be.false;
   // });

});

describe("MyCRTService GET /", () => {

   // let mycrt: MyCRTService;
   // before(() => {
   //    mycrt = new MyCRTService();
   //    mycrt.launch();
   // });

   // after(() => {
   //    mycrt.close();
   // });

   // it("should return 200", (done) => {
   //    chai.request(mycrt.getServer()).get('/').then((response) => {
   //       expect(response).to.have.status(http.OK);
   //       done();
   //    });
   // });

});
