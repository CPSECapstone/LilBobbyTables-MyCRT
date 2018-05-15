import { expect, request } from 'chai';
import * as http from 'http-status-codes';
import 'mocha';

import { Logging } from '@lbt-mycrt/common/dist/main';

import { anotherBadReplayBody, badReplayBody, badScheduledReplay,
   liveCaptureBody, newEnvBody, replayBody } from './data';
import { MyCrtServiceTestClient } from './mycrt';

export const replayTests = (mycrt: MyCrtServiceTestClient) => function() {

   // post
   it("should post a replay", async function() {
      await mycrt.post(http.OK, '/api/environments/', newEnvBody);
      await mycrt.post(http.OK, '/api/captures/', liveCaptureBody);
      const response = await mycrt.post(http.OK, '/api/replays/', replayBody);
      expect(response.body.id).to.equal(1);
   });

   // fail posts
   it("should fail to schedule a replay without a start time", async function() {
      await mycrt.post(http.OK, '/api/environments/', newEnvBody);
      await mycrt.post(http.OK, '/api/captures/', liveCaptureBody);
      const response = await mycrt.post(http.BAD_REQUEST, '/api/replays/', badScheduledReplay);
   });

   it("should fail to create a replay because of a bad db reference", async function() {
      await mycrt.post(http.OK, '/api/environments/', newEnvBody);
      await mycrt.post(http.OK, '/api/captures/', liveCaptureBody);
      const response = await mycrt.post(http.BAD_REQUEST, '/api/replays', badReplayBody);
   });

   it("should fail to create a replay because the captureId does not exist", async function() {
      await mycrt.post(http.OK, '/api/environments/', newEnvBody);
      await mycrt.post(http.OK, '/api/captures/', liveCaptureBody);
      const response = await mycrt.post(http.BAD_REQUEST, '/api/replays', anotherBadReplayBody);
   });

   it("should fail to create multiple replays on the same DB", async function() {
      await mycrt.post(http.OK, '/api/environments', newEnvBody);
      await mycrt.post(http.OK, '/api/captures', liveCaptureBody);
      await mycrt.post(http.OK, '/api/replays', replayBody);

      const failedResponse = await mycrt.post(http.BAD_REQUEST, '/api/replays', {
         ...replayBody,
         name: "otherReplay",
      });
      expect(failedResponse.body.message).to.contain("already at least 1 replay running on that database");
   });

   // get
   it("should get all replays", async function() {
      await mycrt.post(http.OK, '/api/environments/', newEnvBody);
      await mycrt.post(http.OK, '/api/captures/', liveCaptureBody);
      await mycrt.post(http.OK, '/api/replays/', replayBody);
      const response = await mycrt.get(http.OK, '/api/replays');
   });

   it("should get a replay", async function() {
      await mycrt.post(http.OK, '/api/environments/', newEnvBody);
      await mycrt.post(http.OK, '/api/captures/', liveCaptureBody);
      const replay = await mycrt.post(http.OK, '/api/replays/', replayBody);
      const response = await mycrt.get(http.OK, '/api/replays/' + replay.body.id);
   });

   it("should get all replays for a capture", async function() {
      await mycrt.post(http.OK, '/api/environments/', newEnvBody);
      const capture = await mycrt.post(http.OK, '/api/captures/', liveCaptureBody);
      const replay = await mycrt.post(http.OK, '/api/replays/', replayBody);
      const response = await mycrt.get(http.OK, '/api/replays/?captureId=' + capture.body.id);
   });

   // bad gets
   it("should fail since replay does not exist", async function() {
      await mycrt.post(http.OK, '/api/environments/', newEnvBody);
      await mycrt.post(http.OK, '/api/captures/', liveCaptureBody);
      const response = await mycrt.get(http.NOT_FOUND, '/api/replays/1');
   });

   // delete
   it("should successfully delete a replay", async function() {
      await mycrt.post(http.OK, '/api/environments/', newEnvBody);
      await mycrt.post(http.OK, '/api/captures/', liveCaptureBody);
      await mycrt.post(http.OK, '/api/replays/', replayBody);
      const response = await mycrt.delete(http.OK, '/api/replays/1');
   });

   // fail delete
   it("should fail since replay 56 does not exist", async function() {
      const response = await mycrt.delete(http.NOT_FOUND, '/api/replays/56');
   });

};
