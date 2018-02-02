import fs = require('fs-extra');
import path = require('path');

const SANDBOX_PATH = '/tmp/MyCRT/sandbox/';

export const getSandboxPath = (): string => {
   if (!fs.pathExistsSync(SANDBOX_PATH)) {
      fs.mkdirsSync(SANDBOX_PATH);
   }
   return SANDBOX_PATH;
};
