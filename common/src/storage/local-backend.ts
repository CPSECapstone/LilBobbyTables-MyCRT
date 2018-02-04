import fs = require('fs-extra');
import path = require('path');

import Logging = require('../logging');

import { StorageBackend } from './backend';

const logger = Logging.defaultLogger(__dirname);

export class LocalBackend extends StorageBackend {

   constructor(private rootDir: string) {
      super();

      if (!fs.existsSync(this.rootDir)) {
         fs.mkdirSync(this.rootDir);
      }
   }

   public exists(key: string): Promise<boolean> {
      const file = path.join(this.rootDir, key);
      return fs.pathExists(file);
   }

   public async readJson<T>(key: string): Promise<T> {
      const file = path.join(this.rootDir, key);
      const json = await fs.readJSON(file);
      return json;
   }

   public async writeJson<T>(key: string, value: T): Promise<void> {
      const file = path.join(this.rootDir, key);
      const dir = path.dirname(file);
      if (!await fs.pathExists(dir)) {
         fs.mkdirs(dir);
      }
      return fs.writeJSON(file, value);
   }

   public async deleteJson(key: string): Promise<void> {
      const file = path.join(this.rootDir, key);
      return fs.unlink(file);
   }

}
