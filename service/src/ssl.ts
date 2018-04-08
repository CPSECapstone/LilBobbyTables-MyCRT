import * as fs from 'fs';
import * as path from 'path';

import { Logging } from '@lbt-mycrt/common';

const logger = Logging.defaultLogger(__dirname);

const sslDir: string = path.normalize(path.join(__dirname, '..', 'ssl'));
const fullchainPemPath: string = path.join(sslDir, 'fullchain.pem');
const privkeyPemPath: string = path.join(sslDir, 'privkey.pem');

export const sslSetupCheck = () => {
   if (!fs.existsSync(sslDir)) {
      logger.error(`sslDir ${sslDir} does not exist!`);
      process.exit(1);
   }

   if (!fs.existsSync(fullchainPemPath)) {
      logger.error(`fullchain.pem does not exist at ${fullchainPemPath}`);
      process.exit(1);
   }

   if (!fs.existsSync(privkeyPemPath)) {
      logger.error(`privkey.pem does not exist at ${privkeyPemPath}`);
      process.exit(1);
   }
};

export const getSslOptions = () => {
   return {
      cert: fs.readFileSync(fullchainPemPath),
      key: fs.readFileSync(privkeyPemPath),
   };
};
