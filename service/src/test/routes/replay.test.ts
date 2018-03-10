import { expect, request } from 'chai';
import * as http from 'http-status-codes';
import 'mocha';

import { Logging } from '@lbt-mycrt/common/dist/main';

import { anotherBadReplayBody, badReplayBody, liveCaptureBody, newEnvBody, replayBody } from './data';
import { MyCrtServiceTestClient } from './mycrt';

export const replayTests = (mycrt: MyCrtServiceTestClient) => () => {

   // post
   it("should post a replay", async () => {
      await mycrt.post(http.OK, '/api/environments/', newEnvBody);
      await mycrt.post(http.OK, '/api/captures/', liveCaptureBody);
      const response = await mycrt.post(http.OK, '/api/replays/', replayBody);
      expect(response.body.id).to.equal(1);
   });

   // fail posts
   it("should fail to create a replay because of a bad db reference", async () => {
      await mycrt.post(http.OK, '/api/environments/', newEnvBody);
      await mycrt.post(http.OK, '/api/captures/', liveCaptureBody);
      const response = await mycrt.post(http.BAD_REQUEST, '/api/replays', badReplayBody);
   });

   it("should fail to create a replay because the captureId does not exist", async () => {
      await mycrt.post(http.OK, '/api/environments/', newEnvBody);
      await mycrt.post(http.OK, '/api/captures/', liveCaptureBody);
      const response = await mycrt.post(http.BAD_REQUEST, '/api/replays', anotherBadReplayBody);
   });

   // get
   it("should get all replays", async () => {
      await mycrt.post(http.OK, '/api/environments/', newEnvBody);
      await mycrt.post(http.OK, '/api/captures/', liveCaptureBody);
      await mycrt.post(http.OK, '/api/replays/', replayBody);
      const response = await mycrt.get(http.OK, '/api/replays');
   });

   it("should get a replay", async () => {
      await mycrt.post(http.OK, '/api/environments/', newEnvBody);
      await mycrt.post(http.OK, '/api/captures/', liveCaptureBody);
      const replay = await mycrt.post(http.OK, '/api/replays/', replayBody);
      const response = await mycrt.get(http.OK, '/api/replays/' + replay.body.id);
   });

   it("should get all replays for a capture", async () => {
      await mycrt.post(http.OK, '/api/environments/', newEnvBody);
      const capture = await mycrt.post(http.OK, '/api/captures/', liveCaptureBody);
      const replay = await mycrt.post(http.OK, '/api/replays/', replayBody);
      const response = await mycrt.get(http.OK, '/api/replays/?captureId=' + capture.body.id);
   });

   // bad gets
   it("should fail since replay does not exist", async () => {
      await mycrt.post(http.OK, '/api/environments/', newEnvBody);
      await mycrt.post(http.OK, '/api/captures/', liveCaptureBody);
      const response = await mycrt.get(http.NOT_FOUND, '/api/replays/1');
   });

   // delete
   it("should successfully delete a replay", async () => {
      await mycrt.post(http.OK, '/api/environments/', newEnvBody);
      await mycrt.post(http.OK, '/api/captures/', liveCaptureBody);
      await mycrt.post(http.OK, '/api/replays/', replayBody);
      const response = await mycrt.delete(http.OK, '/api/replays/1');
   });

   // fail delete
   it("should fail since replay 56 does not exist", async () => {
      const response = await mycrt.delete(http.NOT_FOUND, '/api/replays/56');
   });

};
