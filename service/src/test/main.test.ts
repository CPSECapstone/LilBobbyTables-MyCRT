import * as chai from 'chai';
import chaiHttp = require('chai-http');
import 'mocha';

import MyCRTService from '../main';

process.env.NODE_ENV = 'test';

const expect = chai.expect;
chai.use(chaiHttp);

describe("MyCRTService index", () => {

   let mycrt: MyCRTService;
   before(() => {
      mycrt = new MyCRTService();
      mycrt.launch();
   });

   after(() => {
      mycrt.close();
   });

   it("should return 200", () => {
      chai.request(mycrt.getServer()).get('/').then((response) => {
         expect(response).to.have.status(200);
      });
   });

});
