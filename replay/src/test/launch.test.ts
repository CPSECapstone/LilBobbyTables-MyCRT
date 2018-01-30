import 'mocha';

import { launch } from '../launch';

describe("launch", () => {
   it("should not fail", () => {
      launch({ id: 123 });
   });
});
