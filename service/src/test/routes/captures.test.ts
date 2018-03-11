import { expect, request } from 'chai';
import * as http from 'http-status-codes';
import 'mocha';

import { Logging } from '@lbt-mycrt/common/dist/main';

import { badScheduledCapture, captureBadEnv, captureBadStatus, liveCaptureBody, newEnvBody,
   scheduledCaptureBody } from './data';
import { MyCrtServiceTestClient } from './mycrt';

export const captureTests = (mycrt: MyCrtServiceTestClient) => function() {

   it("should post a capture", async function() {
      await mycrt.post(http.OK, '/api/environments/', newEnvBody);
      const response = await mycrt.post(http.OK, '/api/captures/', liveCaptureBody);
      expect(response.body.id).to.equal(1);
   });

   it("should fail to schedule a capture without a start time", async function() {
      await mycrt.post(http.OK, '/api/environments/', newEnvBody);
      const response = await mycrt.post(http.BAD_REQUEST, '/api/captures/', badScheduledCapture);
   });

   it("should reject the post of a capture with invalid status", async function() {
      await mycrt.post(http.OK, '/api/environments/', newEnvBody);
      const response = await mycrt.post(http.BAD_REQUEST, '/api/captures/', captureBadStatus);
   });

   it("should reject the post of a capture with bad environment", async function() {
      await mycrt.post(http.OK, '/api/environments/', newEnvBody);
      const response = await mycrt.post(http.BAD_REQUEST, '/api/captures/', captureBadEnv);
   });

   it("should get all captures", async function() {
      const env = await mycrt.post(http.OK, '/api/environments/', newEnvBody);
      const cap1 = await mycrt.post(http.OK, '/api/captures/', liveCaptureBody);
      const cap2 = await mycrt.post(http.OK, '/api/captures/', scheduledCaptureBody);
      const response = await mycrt.get(http.OK, '/api/captures');
      expect(response.body.length).to.equal(2);
   });

   it("should get an existing capture", async function() {
      await mycrt.post(http.OK, '/api/environments/', newEnvBody);
      const capture = await mycrt.post(http.OK, '/api/captures/', liveCaptureBody);
      const id = capture.body.id;
      const response = await mycrt.get(http.OK, '/api/captures/' + id);
      expect(response.body.name).equals(capture.body.name);
   });

   it("should fail to get a capture that does not exist", async function() {
      await mycrt.post(http.OK, '/api/environments/', newEnvBody);
      await mycrt.post(http.OK, '/api/captures/', liveCaptureBody);
      const response = await mycrt.get(http.NOT_FOUND, '/api/captures/10');
   });

   it("should fail to get capture metrics that do not exist", async function() {
      const response = await mycrt.get(http.NOT_FOUND, '/api/captures/50/metrics/');
   });

   it("should fail to stop a capture that does not exist", async function() {
      await mycrt.post(http.OK, '/api/environments/', newEnvBody);
      const response = await mycrt.post(http.NOT_FOUND, '/api/captures/50/stop/');
   });

   it("should reject the edit of a capture", async function() {
      await mycrt.post(http.OK, '/api/environments/', newEnvBody);
      await mycrt.post(http.OK, '/api/captures/', scheduledCaptureBody);
      const response = await mycrt.put(http.NOT_FOUND, '/api/captures/1', scheduledCaptureBody);
   });

   it("should successfully delete an existing capture", async function() {
      await mycrt.post(http.OK, '/api/environments/', newEnvBody);
      const capture = await mycrt.post(http.OK, '/api/captures/', liveCaptureBody);
      const id = capture.body.id;
      const response = await mycrt.delete(http.OK, '/api/captures/' + id);
   });

   it("should fail to delete a capture that does not exist", async function() {
      const response = await mycrt.delete(http.NOT_FOUND, '/api/captures/100');
   });
};
