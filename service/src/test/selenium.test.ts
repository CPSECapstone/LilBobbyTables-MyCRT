import { request } from 'chai';
import * as chai from 'chai';
import { Server } from 'http';
import * as http from 'http-status-codes';
import 'mocha';

import selenium = require('selenium-webdriver');

import MyCrtService from '../main';
import { liveCaptureBody, newEnvBody } from './routes/data';

const webdriver = selenium;
const By = webdriver.By;
const until = webdriver.until;
const expect = chai.expect;

const driver = new webdriver.Builder()
    .forBrowser('chrome')
    .build();

export const mycrt: MyCrtService = new MyCrtService();

export const launchMyCrtService = async () => {
   expect(await mycrt.launch().catch((reason: any) => {
      chai.assert.fail(`mycrt launch failed: ${reason}`);
   })).to.be.true;
   expect(mycrt.getServer()).to.be.instanceOf(Server);
   expect(mycrt.isLaunched()).to.be.true;
   await request(mycrt.getServer()).post('/api/environments/').send(newEnvBody);
   const response = await request(mycrt.getServer()).post('/api/captures/').send(liveCaptureBody);
   expect(response).to.have.status(http.OK);
   expect(response.body.id).to.equal(1);
   // ask the browser to open a page
   driver.navigate().to('http://localhost:3000/capture?id=1&envId=1&view=metrics');
};

export const closeMyCrtService = async () => {
   driver.quit();
   expect(await mycrt.close().catch((reason: any) => {
      chai.assert.fail(`mycrt close failed: ${reason}`);
   })).to.be.true;
   expect(mycrt.getServer()).to.be.null;
   expect(mycrt.isLaunched()).to.be.false;
};

describe('metrics page', () => {
   // mocha.timeout(10000);

   before(launchMyCrtService);
   after(closeMyCrtService);

   it('add graph to metrics page', () => {
      return driver.findElement(By.className('graph-drop')).click();
      // return driver.findElement(By.xpath("//input[@value='CPU']")).click();
      // driver.wait(until.elementLocated(By.id('newEnv')));
      // driver.findElement(By.id('newEnv')).click();
      // driver.findElement(By.id('envName')).sendKeys('Hilary Environment');
      // driver.findElement(By.id('1')).click();
      // return driver.findElement(By.id('accessKey'));
      // return driver.findElement(By.class('graph-drop')).click();
      // return driver.findElement(By.xpath("//input[@value='CPU']")).click();
      // return driver.findElement(By.id('newEnv')).click();
   }).timeout(10000);

});
