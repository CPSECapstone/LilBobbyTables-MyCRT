import { AWSError, S3 } from 'aws-sdk';

import Logging = require('../logging');

import { StorageBackend } from './backend';

const logger = Logging.defaultLogger(__dirname);

export class S3Backend extends StorageBackend {
   constructor(private s3: S3, private bucket: string, private prefix: string) {
      super();
   }

   public rootDirectory(): string { return this.bucket; }

   public exists(key: string): Promise<boolean> {

      const params: S3.HeadObjectRequest = {
         Bucket: this.bucket,
         Key: this.attachPrefix(key),
      };

      return new Promise<boolean>((resolve, reject) => {
         this.s3.headObject(params, (err: AWSError, data: S3.HeadObjectOutput) => {
            if (err && err.code === 'NotFound') {
               resolve(false);
            } else if (!err) {
               resolve(true);
            } else {
               reject(err);
            }
         });
      });
   }

   public bucketExists(): Promise<boolean> {

      const params: S3.HeadBucketRequest = {
         Bucket: this.bucket,
      };

      return new Promise<boolean>((resolve, reject) => {
         this.s3.headBucket(params, (err: AWSError, data: S3.HeadObjectOutput) => {
            if (err && err.code === 'NotFound') {
               resolve(false);
            } else if (!err) {
               resolve(true);
            } else {
               reject(err);
            }
         });
      });
   }

   public async allMatching(dirPrefix: string, pattern: RegExp): Promise<string[]> {
      dirPrefix = this.attachPrefix(dirPrefix);
      const keys = await this.listObjects(dirPrefix);
      const result: string[] = [];
      keys.forEach((key) => {
         const check = key.substring(dirPrefix.length);
         if (check.match(pattern)) {
            result.push(key);
         }
      });
      return result;
   }

   public async readJson<T>(key: string): Promise<T> {
      const params: S3.GetObjectRequest = {
         Bucket: this.bucket,
         Key: this.attachPrefix(key),
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
         Key: this.attachPrefix(key),
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
         Key: this.attachPrefix(key),
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

   public async deletePrefix(dirPrefix: string): Promise<void> {
      dirPrefix = this.attachPrefix(dirPrefix);
      logger.info(`deleting prefix: ${dirPrefix}`);
      const keys = await this.listObjects(dirPrefix);
      keys.forEach(async (key) => await this.deleteJson(key));
   }

   private async listObjects(prefix?: string): Promise<string[]> {

      const params: S3.ListObjectsRequest = {
         Bucket: this.bucket,
         Prefix: prefix,
      };

      return new Promise<string[]>((resolve, reject) => this.s3.listObjects(params, (err, data) => {
         if (err) {
            logger.error(err.message);
            reject(err);
         } else if (!data.Contents) {
            resolve([]);
         } else {
            resolve(data.Contents.map((s3Obj) => s3Obj.Key || ''));
         }
      }));
   }

   private attachPrefix(key: string): string {
      if (key.lastIndexOf(this.prefix, 0) !== 0) {
         key = (this.prefix != null ? this.prefix + "/" + key : key);
      }
      return key;
   }

}
