import { expect, request } from 'chai';
import * as http from 'http-status-codes';
import 'mocha';

import { Logging } from '@lbt-mycrt/common/dist/main';
import MyCrtService from '../../main';

import { anotherBadReplayBody, badReplayBody, liveCaptureBody, newEnvBody, replayBody } from './data';

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
   it("should fail since replay does not exist", async () => {
      try {
         await request(mycrt.getServer()).post('/api/environments/').send(newEnvBody);
         await request(mycrt.getServer()).post('/api/captures/').send(liveCaptureBody);
         const response = await request(mycrt.getServer()).get('/api/replays/1');
      } catch (err) {
         expect(err).to.have.status(http.NOT_FOUND);
      }
   });

   it("should fail since replay's capture does not exist", async () => {
      try  {
         await request(mycrt.getServer()).post('/api/environments/').send(newEnvBody);
         const response = await request(mycrt.getServer()).get('/api/replays/');
      } catch (err) {
         expect(err).to.have.status(http.CONFLICT);
      }
   });

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
         await request(mycrt.getServer()).post('/api/environments/').send(newEnvBody);
         await request(mycrt.getServer()).post('/api/captures/').send(liveCaptureBody);
         const response = await request(mycrt.getServer()).del('/api/replays/1').send();
         expect(response).to.have.status(http.OK);
   });
};
