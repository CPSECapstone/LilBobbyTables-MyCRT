import 'mocha';

import { CaptureConfig } from '../args';
import { launch } from '../launch';

describe("launch", () => {
   it("should not fail", () => {
      launch(new CaptureConfig(123));
   });
});
