import * as chai from 'chai';
import chaiHttp = require('chai-http');
import * as http from 'http-status-codes';
import 'mocha';

import { Logging } from '@lbt-mycrt/common';

import { newEnvBody } from './routes/data';
import { MyCrtServiceTestClient } from "./routes/mycrt";

const expect = chai.expect;
chai.use(chaiHttp);

export const indexTests = (mycrt: MyCrtServiceTestClient) => function() {

   const logger = Logging.defaultLogger(__dirname);

   describe("without any environments", function() {

      it("should return 200 with a slash", async function() {
         const response = await mycrt.get(http.OK, '/');
      });

      it("should return 200 without a slash", async function() {
         const response = await mycrt.get(http.OK, '');
      });

   });

   describe("with at least one environment", function() {

      it("should redirect to the environment dashboard", async function() {

         // add an environment
         await mycrt.post(http.OK, '/api/environments', newEnvBody);
         const allEnvResponse = await mycrt.get(http.OK, '/api/environments');
         expect(allEnvResponse.body.length).to.equal(1);

         // check for the redirect
         // the redirect happens internally to the chai http client
         // so check the body for the environments-app instead of the redirection status code
         const response = await mycrt.get(http.OK, '/');
         expect(response.text).to.contain(`<div id="environments-app"></div>`);

      });

   });

};
