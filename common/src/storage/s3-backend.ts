import { AWSError, S3 } from 'aws-sdk';

import Logging = require('../logging');

import { StorageBackend } from './backend';

const logger = Logging.defaultLogger(__dirname);

export class S3Backend extends StorageBackend {

   constructor(private s3: S3, private bucket: string) {
      super();
   }

   public async readJson<T>(key: string): Promise<T> {

      const params: S3.GetObjectRequest = {
         Bucket: this.bucket,
         Key: key,
      };

      return new Promise<T>((resolve, reject) => {
         this.s3.getObject(params, (err: AWSError, data: S3.GetObjectOutput) => {

            if (err) {
               logger.error(err.message);
               reject(err.code);
            } else {
               const body: string = data.Body!.toString();
               const result: T = JSON.parse(body) as T;
               resolve(result);
            }

         });
      });
   }

   public async writeJson<T>(key: string, value: T): Promise<void> {

      const params: S3.PutObjectRequest = {
         Body: Buffer.from(JSON.stringify(value)),
         Bucket: this.bucket,
         Key: key,
      };

      return new Promise<void>((resolve, reject) => {
         this.s3.putObject(params, (err: AWSError, data: S3.PutObjectOutput) => {

            if (err) {
               logger.error(err.message);
               reject(err.code);
            } else {
               resolve();
            }

         });
      });
   }

   public async deleteJson(key: string): Promise<void> {

      const params: S3.DeleteObjectRequest = {
         Bucket: this.bucket,
         Key: key,
      };

      return new Promise<void>((resolve, reject) => {
         this.s3.deleteObject(params, (err: AWSError, data: S3.DeleteObjectOutput) => {

            if (err) {
               logger.error(err.message);
               reject(err.code);
            } else {
               resolve();
            }

         });
      });
   }

}
