import { expect, request } from 'chai';
import * as http from 'http-status-codes';
import 'mocha';

import { Logging } from '@lbt-mycrt/common/dist/main';
import MyCrtService from '../../main';

export const newEnvBody = {
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

export const scheduledCaptureBody = {
   name: "ScheduledCapture",
   envId: 1,
   status: "SCHEDULED",
   scheduledStart: "2020-03-04 20:53:00",
};

export const liveCaptureBody = {
   name: "LiveCapture",
   envId: 1,
   start: "2018-03-04 20:53:00",
   end: null,
};

export const replayBody = {
   name: "myReplay",
   start: "2017-11-02 12:00:00",
   end: null,
   captureId: 1,
   dbName: "nfltest2015",
   host: "nfl2015.c7m7t1xyrt7v.us-east-2.rds.amazonaws.com",
   user: "nfltest2015user",
   pass: "nfltest2015pass",
   instance: "nfltest2015",
   parameterGroup: "testsupergroup",
};

export const badReplayBody = {
   name: "BadReplay",
   start: "2017-11-02 12:00:00",
   end: null,
   captureId: 1,
   dbName: "bad db name",
   host: "nfl2015.c7m7t1xyrt7v.us-east-2.rds.amazonaws.com",
   user: "nfltest2015user",
   pass: "nfltest2015pass",
   instance: "nfltest2015",
   parameterGroup: "testsupergroup",
};

export const anotherBadReplayBody = {
   name: "BadReplay",
   start: "2017-11-02 12:00:00",
   end: null,
   captureId: null,
   dbName: "nfltest2015",
   host: "nfl2015.c7m7t1xyrt7v.us-east-2.rds.amazonaws.com",
   user: "nfltest2015user",
   pass: "nfltest2015pass",
   instance: "nfltest2015",
   parameterGroup: "testsupergroup",
};

export const replayTests = (mycrt: MyCrtService) => () => {

   // post
   it("should post a replay", async () => {
      await request(mycrt.getServer()).post('/api/environments/').send(newEnvBody);
      await request(mycrt.getServer()).post('/api/captures/').send(liveCaptureBody);
      const response = await request(mycrt.getServer()).post('/api/replays/').send(replayBody);
      expect(response).to.have.status(http.OK);
      expect(response.body.id).to.equal(1);
   });

   // fail posts
   it("should fail to create a replay because of a bad db reference", async () => {
      try {
         await request(mycrt.getServer()).post('/api/environments/').send(newEnvBody);
         await request(mycrt.getServer()).post('/api/captures/').send(liveCaptureBody);
         const response = await request(mycrt.getServer()).post('/api/replays').send(badReplayBody);
      } catch (err) {
         expect(err).to.have.status(http.BAD_REQUEST);
      }
   });

   it("should fail to create a replay because the captureId does not exist", async () => {
      try {
         await request(mycrt.getServer()).post('/api/environments/').send(newEnvBody);
         await request(mycrt.getServer()).post('/api/captures/').send(liveCaptureBody);
         const response = await request(mycrt.getServer()).post('/api/replays').send(anotherBadReplayBody);
      } catch (err) {
         expect(err).to.have.status(http.BAD_REQUEST);
      }
   });

   // get
   it("should get all replays", async () => {
      await request(mycrt.getServer()).post('/api/environments/').send(newEnvBody);
      await request(mycrt.getServer()).post('/api/captures/').send(liveCaptureBody);
      await request(mycrt.getServer()).post('/api/replays/').send(replayBody);
      const response = await request(mycrt.getServer()).get('/api/replays');
      expect(response).to.have.status(http.OK);
   });

   it("should get a replay", async () => {
      await request(mycrt.getServer()).post('/api/environments/').send(newEnvBody);
      await request(mycrt.getServer()).post('/api/captures/').send(liveCaptureBody);
      const replay = await request(mycrt.getServer()).post('/api/replays/').send(replayBody);
      const response = await request(mycrt.getServer()).get('/api/replays/' + replay.body.id);
      expect(response).to.have.status(http.OK);
   });

   it("should get all replays for a capture", async () => {
      await request(mycrt.getServer()).post('/api/environments/').send(newEnvBody);
      const capture = await request(mycrt.getServer()).post('/api/captures/').send(liveCaptureBody);
      const replay = await request(mycrt.getServer()).post('/api/replays/').send(replayBody);
      const response = await request(mycrt.getServer()).get('/api/replays/?captureid=' + capture.body.id);
      expect(response).to.have.status(http.OK);
   });

   // bad gets
   it("should fail since replay 1 does not exist", async () => {
      try {
         await request(mycrt.getServer()).post('/api/environments/').send(newEnvBody);
         await request(mycrt.getServer()).post('/api/captures/').send(liveCaptureBody);
         const response = await request(mycrt.getServer()).get('/api/replays/1');
      } catch (err) {
         expect(err).to.have.status(http.NOT_FOUND);
      }
   });

   // replay 1's capture does not exist ???
   it("should fail since replay 1's capture does not exist", async () => {
      await request(mycrt.getServer()).post('/api/environments/').send(newEnvBody);
      const replay = await request(mycrt.getServ er()).post('/api/replays/').send(replayBody);
      const response = await request(mycrt.getServer()).get('/api/replays/1');
      expect(response).to.have.status(http.CONFLICT);
   });

   // replay 1's environment does not exist ???
   // it("should fail since replay 1 does not have an environment", async () => {
   //    await request(mycrt.getServer()).post('/api/environments/').send(newEnvBody);
   //    await request(mycrt.getServer()).post('/api/captures/').send(liveCaptureBody);
   //    await request(mycrt.getServer()).post('/api/replays/').send(replayBody);
   //    await request(mycrt.getServer()).del('/api/environments/1').send();
   //    const response = await request(mycrt.getServer()).get('/api/replays/1');
   //    expect(response).to.have.status(http.CONFLICT);
   // });

   // delete
   it("should successfully delete a replay", async () => {
      await request(mycrt.getServer()).post('/api/environments/').send(newEnvBody);
      await request(mycrt.getServer()).post('/api/captures/').send(liveCaptureBody);
      await request(mycrt.getServer()).post('/api/replays/').send(replayBody);
      const response = await request(mycrt.getServer()).del('/api/replays/1').send();
      expect(response).to.have.status(http.OK);
   });

   // fail delete
   it("should fail since replay 1 does not exist", async () => {
      // try {
         await request(mycrt.getServer()).post('/api/environments/').send(newEnvBody);
         await request(mycrt.getServer()).post('/api/captures/').send(liveCaptureBody);
         const response = await request(mycrt.getServer()).del('/api/replays/1').send();
         expect(response).to.have.status(http.OK);
      // } catch (err) {

      // }
   });
};
