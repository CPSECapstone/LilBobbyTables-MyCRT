// Transformed this to typescript:
// https://github.com/philidem/node-app-root-dir/blob/master/lib/index.js

import * as fs from 'fs';
import * as path from 'path';

export default (givenPath: string | undefined = undefined): string => {

   let rootDir: string | null = null;

   const NODE_MODULES = `${path.sep}node_modules${path.sep}`;
   const cwd = givenPath ? givenPath as string : process.cwd();
   let pos = cwd.indexOf(NODE_MODULES);
   if (pos !== -1) {
      rootDir = cwd.substring(0, pos);
   } else if (fs.existsSync(path.join(cwd, 'package.json'))) {
      rootDir = cwd;
   } else {
      pos = __dirname.indexOf(NODE_MODULES);
      if (pos === -1) {
         rootDir = path.normalize(path.join(__dirname, '..'));
      } else {
         rootDir = __dirname.substring(0, pos);
      }
   }

   return rootDir as string;
};
