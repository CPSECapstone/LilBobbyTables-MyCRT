
import * as fs from 'fs';
import * as path from 'path';

import appRootDir from '../app-root-dir';

export default class Configuration {

   public readonly id: number;
   public readonly logFile: string;

   constructor(id: number) {
      this.id = id;

      const appRoot = appRootDir();
      const logDir = path.join(appRoot, 'logs');
      if (!fs.existsSync(logDir)) {
         fs.mkdirSync(logDir);
      }
      this.logFile = path.join(logDir, `capture${this.id}.log`);
   }

}
