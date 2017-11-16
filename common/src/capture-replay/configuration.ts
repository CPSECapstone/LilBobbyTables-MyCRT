
import * as fs from 'fs';
import * as path from 'path';

import appRootDir from '../app-root-dir';

export enum ProcessType { CAPTURE = 'capture', REPLAY = 'replay' }

export class Configuration {

   public readonly id: number;
   public readonly type: ProcessType;
   public readonly logFile: string;

   constructor(id: number, type: ProcessType) {
      this.id = id;
      this.type = type;

      const appRoot = appRootDir();
      const logDir = path.join(appRoot, 'logs');
      if (!fs.existsSync(logDir)) {
         fs.mkdirSync(logDir);
      }
      this.logFile = path.join(logDir, `${this.type}${this.id}.log`);
   }

}
