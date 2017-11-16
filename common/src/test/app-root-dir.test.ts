import { expect } from 'chai';
import 'mocha';
import * as path from 'path';

import appRootDir from '../app-root-dir';

describe("appRootDir", () => {
   it("should find the correct basename", () => {

      const rootDir: string = appRootDir(__filename);
      const basename: string = path.basename(rootDir);

      expect(basename).to.equal("common");

   });
});
