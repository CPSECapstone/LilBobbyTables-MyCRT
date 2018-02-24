import 'mocha';

import { ReplayConfig } from '../args';
import { launch } from '../launch';

describe("launch", () => {
   it("should not fail", () => {
      launch(new ReplayConfig(321, 123, 213));
   });
});
