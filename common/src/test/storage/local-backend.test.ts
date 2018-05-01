import { expect } from 'chai';
import fs = require('fs-extra');
import 'mocha';
import path = require('path');
import uuid = require('uuid/v1');

import { LocalBackend } from '../../storage/local-backend';

import { dummyData, key } from './data';

describe("LocalBackend", () => {

   let backend: LocalBackend;
   let rootDir: string;

   before(() => {
      rootDir = path.join(__dirname, uuid());
      fs.mkdirSync(rootDir);
      backend = new LocalBackend(rootDir, "");
   });

   after(() => {
      fs.remove(rootDir);
   });

   it("should know if a file exists", async () => {
      expect(await backend.exists(key)).to.be.false;
      await backend.writeJson(key, dummyData);
      expect(await backend.exists(key)).to.be.true;
   });

   it("should write data, then read it back", async () => {

      await backend.writeJson(key, dummyData);
      const result = await backend.readJson(key) as any;

      expect(result.name).to.equal(dummyData.name);
      expect(result.age).to.equal(dummyData.age);

   });

   it("should delete files, and fail to read missing files", async () => {

      await backend.writeJson(key, dummyData);
      await backend.deleteJson(key);
      const result = await backend.readJson(key)
         .catch((reason) => {
            expect(reason).to.not.be.null;
         });

   });

});
