import { assert, expect } from 'chai';
import * as http from 'http-status-codes';
import 'mocha';

import { HttpError } from '../http-error';

describe("HttpError", () => {

   it("should be identifiable when thrown", () => {
      const msg = "NOT FOUND";
      try {
         throw new HttpError(http.NOT_FOUND, msg);
      } catch (error) {
         if (error.IS_HTTP_ERROR === true) {
            assert.isTrue(true);
            const httpError = error as HttpError;
            expect(httpError.code).to.equal(http.NOT_FOUND);
            expect(httpError.message).to.equal(msg);
         } else {
            assert.fail();
         }
      }
   });

});
