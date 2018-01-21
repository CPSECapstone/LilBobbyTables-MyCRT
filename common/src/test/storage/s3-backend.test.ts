import { S3 } from 'aws-sdk';
import { expect } from 'chai';
import 'mocha';
import mockito from 'ts-mockito';

import { S3Backend } from '../../storage/s3-backend';

import { dummyData, key } from './data';

describe("S3Backend", () => {

   let s3: S3;
   let backend: S3Backend;

   before(() => {
      s3 = new S3();
      const spiedS3 = mockito.spy(s3);

      mockito.when(spiedS3.getObject(mockito.anything(), mockito.anyFunction()))
         .thenCall((params, callback) => {
            callback(null, {
               Body: JSON.stringify(dummyData),
            });
         });

      mockito.when(spiedS3.putObject(mockito.anything(), mockito.anyFunction()))
         .thenCall((params, callback) => {
            callback();
         });

      backend = new S3Backend(s3, 'lil-test-environment');
   });

   it("should write data, then read it back", async () => {

      await backend.writeJson(key, dummyData);
      const result = await backend.readJson(key) as any;

      expect(result.name).to.equal(dummyData.name);
      expect(result.age).to.equal(dummyData.age);

   });

});
