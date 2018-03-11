import { request } from 'chai';
import * as chai from 'chai';
import { Server } from 'http';
import * as http from 'http-status-codes';
import 'mocha';
import 'mocha-steps';

import selenium = require('selenium-webdriver');

import { ChildProgramStatus } from '../../../common/dist/main';
import { captureDao } from '../dao/mycrt-dao';
import MyCrtService from '../main';
import { liveCaptureBody, newEnvBody } from './routes/data';
import { MyCrtServiceTestClient } from './routes/mycrt';

export const mycrt: MyCrtService = new MyCrtService();
export const mycrtTest: MyCrtServiceTestClient = new MyCrtServiceTestClient(mycrt);

const webdriver = selenium;
const By = webdriver.By;
const until = webdriver.until;
const expect = chai.expect;

const driver = new webdriver.Builder()
    .forBrowser('chrome')
    .build();

const sleep = (ms: number): Promise<void> => {
   ms = ms < 0 ? 0 : ms;
   return new Promise((resolve, reject) => {
      setTimeout(() => {
         resolve();
      }, ms);
   });
};

// launch mycrt service and chromedriver
export const launchMyCrtService = async () => {
   expect(await mycrt.launch().catch((reason: any) => {
      chai.assert.fail(`mycrt launch failed: ${reason}`);
   })).to.be.true;
   expect(mycrt.getServer()).to.be.instanceOf(Server);
   expect(mycrt.isLaunched()).to.be.true;

   // create environment
   await mycrtTest.post(http.OK, '/api/environments/', newEnvBody);

   // start a capture with id 1
   const startResponse = await mycrtTest.post(http.OK, '/api/captures/', liveCaptureBody);
   expect(startResponse.body.id).to.equal(1);

   // stop capture manually
   await captureDao.updateCaptureStatus(1, ChildProgramStatus.DONE);

   // ask the browser to open a page
   driver.navigate().to('http://localhost:3000/capture?id=1&envId=1&view=metrics');
   await sleep(5000);
};

// close mycrt servcie and chromedriver
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
