import 'mocha';

import selenium = require('selenium-webdriver');

const webdriver = selenium;
const By = webdriver.By;
const until = webdriver.until;

const driver = new webdriver.Builder()
    .forBrowser('chrome')
    .build();

describe('metrics page', () => {
   // ask the browser to open a page
   before(() => driver.navigate().to('http://localhost:3000/capture?id=1&envId=1&view=metrics'));

   it('add graph to screen', () => {
      driver.findElement(By.id('graph-drop')).click();
      return driver.findElement(By.xpath("//input[@value='CPU']")).click();
   });

   after(() => driver.quit());
});
