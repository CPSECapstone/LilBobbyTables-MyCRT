import { request } from 'chai';
import * as chai from 'chai';
import { Server } from 'http';
import * as http from 'http-status-codes';
import 'mocha';
import 'mocha-steps';

import selenium = require('selenium-webdriver');

import { ReadMetric, WriteMetric } from '@lbt-mycrt/common/dist/metrics/metrics';
import { MockMetricsBackend } from '@lbt-mycrt/common/dist/metrics/mock-metrics-backend';
import { path } from '@lbt-mycrt/common/dist/storage/backend-schema';
import { LocalBackend } from '@lbt-mycrt/common/dist/storage/local-backend';
import { getSandboxPath } from '@lbt-mycrt/common/dist/storage/sandbox';

import { ChildProgramStatus, CPUMetric, IChildProgram } from '../../../common/dist/main';
import * as session from '../auth/session';
import { captureDao } from '../dao/mycrt-dao';
import MyCrtService from '../main';
import { signupAndLogin } from './main.test';
import { guiCaptureBody, newEnvBody } from './routes/data';
import { MyCrtServiceTestClient } from './routes/mycrt';

export const mycrt: MyCrtService = new MyCrtService();
export const mycrtTest: MyCrtServiceTestClient = new MyCrtServiceTestClient(mycrt);

const webdriver = selenium;
const By = webdriver.By;
const until = webdriver.until;
const expect = chai.expect;

const chromeCapabilities = webdriver.Capabilities.chrome();
chromeCapabilities.set('chromeOptions', {args: ['--headless']});

const driver = new webdriver.Builder()
    .forBrowser('chrome')
    .withCapabilities(chromeCapabilities)
    .build();

const sleep = (ms: number): Promise<void> => {
   ms = ms < 0 ? 0 : ms;
   return new Promise((resolve, reject) => {
      setTimeout(() => {
         resolve();
      }, ms);
   });
};

const buildMockMetrics = async (capture: IChildProgram): Promise<void> => {
   const mockMetrics = new MockMetricsBackend(60);
   const writeMetrics = await mockMetrics.getMetricsForType(WriteMetric,
      new Date(new Date().getTime() - 60000), new Date());
   const cpuMetrics = await mockMetrics.getMetricsForType(CPUMetric,
      new Date(new Date().getTime() - 60000), new Date());
   const metricsBackend = new LocalBackend(getSandboxPath());
   await metricsBackend.writeJson(path.metrics.getDoneKey(capture), [writeMetrics, cpuMetrics]);
};

function contains<T>(arr: T[], val: T): boolean {
   let found = false;
   arr.forEach((thing) => {
      if (thing === val) {
         found = true;
      }
   });
   return found;
}

// launch mycrt service and chromedriver
export const launchMyCrtService = async () => {
   expect(await mycrt.launch().catch((reason: any) => {
      chai.assert.fail(`mycrt launch failed: ${reason}`);
   })).to.be.true;
   expect(mycrt.getServer()).to.be.instanceOf(Server);
   expect(mycrt.isLaunched()).to.be.true;

   const keysBefore = Object.keys(session.sessions);
   await signupAndLogin(mycrtTest)();
   let sessionToken: string = '';
   expect(Object.keys(session.sessions).length - 1).to.equal(keysBefore.length);
   Object.keys(session.sessions).forEach((token) => {
      if (!contains<string>(keysBefore, token)) {
         sessionToken = token;
      }
   });

   // create environment
   await mycrtTest.post(http.OK, '/api/environments/', newEnvBody);

   // start a capture with id 1
   const startResponse = await mycrtTest.post(http.OK, '/api/captures/', guiCaptureBody);
   expect(startResponse.body.id).to.equal(1);

   // build mock metrics
   await buildMockMetrics(startResponse.body as IChildProgram);
   await sleep(1000);

   // stop capture manually
   await captureDao.updateCaptureStatus(1, ChildProgramStatus.DONE);

   // transfer the login session from the mycrt client to the webdriver
   await driver.navigate().to('http://localhost:3000/login');
   await driver.manage().addCookie({
      name: "MyCRTAuthToken",
      value: sessionToken,
   });

   // ask the browser to open a page
   await driver.navigate().to('http://localhost:3000/capture?id=1&envId=1&view=metrics');
   // await sleep(4000);
};

// close mycrt service and chromedriver
export const closeMyCrtService = async () => {
   driver.quit();
   expect(await mycrt.close().catch((reason: any) => {
      chai.assert.fail(`mycrt close failed: ${reason}`);
   })).to.be.true;
   expect(mycrt.getServer()).to.be.null;
   expect(mycrt.isLaunched()).to.be.false;
};

describe('gui', function() {

   this.timeout(10000);

   before(launchMyCrtService);
   // before(signupAndLogin(mycrtTest));
   after(closeMyCrtService);

   step('should add graph to metrics page', async function() {
      expect((await driver.findElements(By.className("graph"))).length).to.equal(1);
      driver.findElement(By.id('graph-drop')).click();
      driver.findElement(By.xpath("//input[@value='CPU']")).click();
      await sleep(1000);
      expect((await driver.findElements(By.className("graph"))).length).to.be.greaterThan(1);
   });

   step('should remove graph from metrics page', async function() {
      expect((await driver.findElements(By.className("graph"))).length).to.be.greaterThan(1);
      driver.findElement(By.xpath("//input[@value='CPU']")).click();
      await sleep(1000);
      expect((await driver.findElements(By.className("graph"))).length).to.equal(1);
   });

});
