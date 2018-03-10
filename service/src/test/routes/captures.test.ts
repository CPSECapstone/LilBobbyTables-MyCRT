import { expect, request } from 'chai';
import * as http from 'http-status-codes';
import 'mocha';

import { Logging } from '@lbt-mycrt/common/dist/main';
import MyCrtService from '../../main';

import { badScheduledCapture, captureBadEnv, captureBadStatus, liveCaptureBody, newEnvBody,
   scheduledCaptureBody } from './data';

export const captureTests = (mycrt: MyCrtService) => () => {

   it("should post a capture", async () => {
      await request(mycrt.getServer()).post('/api/environments/').send(newEnvBody);
      const response = await request(mycrt.getServer()).post('/api/captures/').send(liveCaptureBody);
      expect(response).to.have.status(http.OK);
      expect(response.body.id).to.equal(1);
   });

   it("should fail to schedule a capture without a start time", async () => {
      try {
         await request(mycrt.getServer()).post('/api/environments/').send(newEnvBody);
         const response = await request(mycrt.getServer()).post('/api/captures/').send(badScheduledCapture);
      } catch (err) {
         expect(err).to.have.status(http.BAD_REQUEST);
      }
   });

   it("should reject the post of a capture with invalid status", async () => {
      try {
         await request(mycrt.getServer()).post('/api/environments/').send(newEnvBody);
         const response = await request(mycrt.getServer()).post('/api/captures/').send(captureBadStatus);
      } catch (err) {
         expect(err).to.have.status(http.BAD_REQUEST);
      }
   });

   it("should reject the post of a capture with bad environment", async () => {
      try {
         await request(mycrt.getServer()).post('/api/environments/').send(newEnvBody);
         const response = await request(mycrt.getServer()).post('/api/captures/').send(captureBadEnv);
      } catch (err) {
         expect(err).to.have.status(http.BAD_REQUEST);
      }
   });

   it("should get all captures", async () => {
      const env = await request(mycrt.getServer()).post('/api/environments/').send(newEnvBody);
      const cap1 = await request(mycrt.getServer()).post('/api/captures/').send(liveCaptureBody);
      const cap2 = await request(mycrt.getServer()).post('/api/captures/').send(scheduledCaptureBody);
      const response = await request(mycrt.getServer()).get('/api/captures');
      expect(response).to.have.status(http.OK);
      expect(response.body.length).to.equal(2);
   });

   it("should get an existing capture", async () => {
      await request(mycrt.getServer()).post('/api/environments/').send(newEnvBody);
      const capture = await request(mycrt.getServer()).post('/api/captures/').send(liveCaptureBody);
      const id = capture.body.id;
      const response = await request(mycrt.getServer()).get('/api/captures/' + id);
      expect(response).to.have.status(http.OK);
      expect(response.body.name).equals(capture.body.name);
   });

   it("should fail to get a capture that does not exist", async () => {
      try {
         await request(mycrt.getServer()).post('/api/environments/').send(newEnvBody);
         await request(mycrt.getServer()).post('/api/captures/').send(liveCaptureBody);
         const response = await request(mycrt.getServer()).get('/api/captures/10');
      } catch (err) {
         expect(err).to.have.status(http.NOT_FOUND);
      }
   });

   it("should fail to get capture metrics that do not exist", async () => {
      try {
         const response = await request(mycrt.getServer()).get('/api/captures/50/metrics/');
      } catch (err) {
         expect(err).to.have.status(http.NOT_FOUND);
      }
   });

   it("should fail to stop a capture that does not exist", async () => {
      try {
         await request(mycrt.getServer()).post('/api/environments/').send(newEnvBody);
         const response = await request(mycrt.getServer()).post('/api/captures/50/stop/').send();
      } catch (err) {
         expect(err).to.have.status(http.NOT_FOUND);
      }
   });

   it("should reject the edit of a capture", async () => {
      try {
         await request(mycrt.getServer()).post('/api/captures/').send(scheduledCaptureBody);
         const response = await request(mycrt.getServer()).put('/api/captures/1').send(scheduledCaptureBody);
      } catch (err) {
         expect(err).to.have.status(http.BAD_REQUEST);
      }
   });

   it("should successfully delete an existing capture", async () => {
      await request(mycrt.getServer()).post('/api/environments/').send(newEnvBody);
      const capture = await request(mycrt.getServer()).post('/api/captures/').send(liveCaptureBody);
      const id = capture.body.id;
      const response = await request(mycrt.getServer()).del('/api/captures/' + id).send();
      expect(response).to.have.status(http.OK);
   });

   it("should fail to delete a capture that does not exist", async () => {
      try {
         const response = await request(mycrt.getServer()).del('/api/captures/100').send();
      } catch (err) {
         expect(err).to.have.status(http.NOT_FOUND);
      }
});
};
