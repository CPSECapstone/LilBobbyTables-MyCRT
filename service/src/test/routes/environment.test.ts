import { expect, request } from 'chai';
import * as http from 'http-status-codes';
import 'mocha';

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

export const environmentTests = (mycrt: MyCrtService) => () => {

   it("should post an environment", () => {
      request(mycrt.getServer()).post('/api/environments/').send(newEnvBody).then((response) => {
         expect(response).to.have.status(http.OK);
         expect(response.body.id).to.equal(1);
      });
   });

};
