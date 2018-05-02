import fs = require('fs-extra');
import path = require('path');

import Logging = require('../logging');

import { StorageBackend } from './backend';

import { DirectoryService } from 'aws-sdk';

const logger = Logging.defaultLogger(__dirname);

export class LocalBackend extends StorageBackend {
   constructor(private rootDir: string, private prefix: string) {
      super();

      if (!fs.existsSync(this.rootDir)) {
         fs.mkdirsSync(this.rootDir);
      }
   }

   public rootDirectory(): string { return this.rootDir; }

   public async exists(key: string): Promise<boolean> {
      const file = path.join(this.rootDir, this.attachPrefix(key));
      return await fs.pathExists(file);
   }

   public async allMatching(dirPrefix: string, pattern: RegExp): Promise<string[]> {
      dirPrefix = this.attachPrefix(dirPrefix);
      const fullDirPrefix = path.join(this.rootDir, dirPrefix);
      const result: string[] = [];

      if (fs.existsSync(fullDirPrefix)) {
         fs.readdirSync(fullDirPrefix).forEach((file) => {
            if (file.match(pattern)) {
               result.push(path.join(dirPrefix, file));
            }
         });
      }

      return result;
   }

   public async readJson<T>(key: string): Promise<T> {
      const file = path.join(this.rootDir, this.attachPrefix(key));
      return fs.readJsonSync(file);
   }

   public async writeJson<T>(key: string, value: T): Promise<void> {
      const file = path.join(this.rootDir, this.attachPrefix(key));
      const dir = path.dirname(file);
      if (!fs.existsSync(dir)) {
         fs.mkdirsSync(dir);
      }
      await fs.writeJSON(file, value);
   }

   public async deleteJson(key: string): Promise<void> {
      const file = path.join(this.rootDir, this.attachPrefix(key));
      return await fs.unlink(file);
   }

   public async deletePrefix(dirPrefix: string): Promise<void> {
      dirPrefix = path.join(this.rootDir, this.attachPrefix(dirPrefix));
      logger.info(`deleting prefix: ${dirPrefix}`);
      if (await fs.pathExists(dirPrefix)) {
         await fs.remove(dirPrefix);
      }
   }

   private attachPrefix(key: string): string {
      if (key.lastIndexOf(this.prefix, 0) !== 0) {
         key = (this.prefix != null ? this.prefix + "/" + key : key);
      }
      return key;
   }

}
