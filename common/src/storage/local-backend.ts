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

   public async readJson<T>(key: string): Promise<T> {
      const file = path.join(this.rootDir, key);
      return new Promise<T>((resolve, reject) => {

         fs.exists(file, (exists: boolean) => {
            if (!exists) {
               const msg = `${file} does not exist`;
               reject(msg);
               logger.error(msg);
            } else {

               fs.readFile(file, (err: any, data: Buffer) => {
                  if (err) {
                     reject(err);
                     logger.error("Error reading file");
                  } else {
                     const result: T = JSON.parse(data.toString()) as T;
                     resolve(result);
                  }
               });
            }
         });

      });
   }

   public async writeJson<T>(key: string, value: T): Promise<void> {
      const file = path.join(this.rootDir, key);
      return new Promise<void>((resolve, reject) => {

         fs.writeFile(file, Buffer.from(JSON.stringify(value)), 'utf8', (err: any) => {
            if (err) {
               reject(err);
            } else {
               resolve();
            }
         });

      });
   }

   public async deleteJson(key: string): Promise<void> {
      const file = path.join(this.rootDir, key);
      return fs.unlink(file);
   }

}
