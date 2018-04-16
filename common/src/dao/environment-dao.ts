import * as data from '../data';
import { ConnectionPool } from './cnnPool';
import { Dao } from './dao';

import bcrypt = require('bcrypt');
const saltRounds = 10;
import Cryptr = require('cryptr');
const cryptr = new Cryptr('MyCRTSecretKey'); // using aes256 encryption algorithm
import { Logging } from '../main';
const logger = Logging.defaultLogger(__dirname);

export class EnvironmentDao extends Dao {

   public async getAllEnvironments(): Promise<data.IEnvironment[]> {
      const environmentRows = await this.query<any[]>('SELECT * FROM Environment', []);
      return environmentRows.map(this.rowToIEnvironment);
   }

   public async getEnvironment(id: number): Promise<data.IEnvironment | null> {
      const rows = await this.query<any[]>('SELECT * FROM Environment WHERE id = ?', [id]);
      if (rows.length === 0) {
         return null;
      }
      return this.rowToIEnvironment(rows[0]);
   }

   public async getEnvironmentFull(id: number): Promise<data.IEnvironmentFull | null> {
      const queryStr = 'SELECT e.name AS envName, d.name AS dbName, host, user, pass, instance, ' +
         'parameterGroup, bucket, accessKey, secretKey, region ' +
         'FROM Environment AS e JOIN DBReference AS d ON e.dbId = d.id ' +
         'JOIN S3Reference AS s ON e.S3Id = s.id JOIN IAMReference AS i ON e.iamId = i.id ' +
         'WHERE e.id = ?';

      const rows = await this.query<any[]>(queryStr, [id]);
      return rows.length ? this.rowToIEnvironmentFull(rows[0]) : null;
   }

   public async makeEnvironment(environment: data.IEnvironment): Promise<data.IEnvironment | null> {
      const row = await this.query<any>('INSERT INTO Environment SET ?', environment);
      return await this.getEnvironment(row.insertId);
   }

   public async deleteEnvironment(id: number): Promise<data.IEnvironment | null> {
      const environment = await this.getEnvironment(id);

      if (environment !== null) {
         await this.deleteDbReference(environment.dbId);
         await this.deleteIamReference(environment.iamId);
         await this.deleteS3Reference(environment.s3Id);
         await this.query<any[]>('DELETE FROM Capture WHERE envId = ?', [id]);
         return this.query<any>('DELETE FROM Environment WHERE id = ?', [id]);
      } else {
         return null;
      }
   }

   /**
    * Remove everything from the database. Be VERY CAREFUL with this.
    */
   public async nuke(): Promise<void> {
      ['Environment', 'IAMReference', 'S3Reference', 'DBReference'].forEach(async (table) => {
         await this.query<void>(`DELETE FROM ${table}`);
         await this.query<void>(`ALTER TABLE ${table} AUTO_INCREMENT = 1`);
      });
   }

   public async editEnvironment(id: number, changes: data.IEnvironment): Promise<data.IEnvironment | null> {
      return this.query<any>('UPDATE Environment SET ? WHERE id = ?', [changes, id]);
   }

   public async getIamReference(id: number): Promise<data.IIamReference> {
      const rows = await this.query<any[]>('SELECT * FROM IAMReference WHERE id = ?', [id]);
      return this.rowToIIamReference(rows[0]);
   }

   public async makeIamReference(iamRef: data.IIamReference): Promise<data.IIamReference> {
      iamRef.accessKey = cryptr.encrypt(iamRef.accessKey);
      iamRef.secretKey = cryptr.encrypt(iamRef.secretKey);
      logger.debug("look I'm encrypted " + iamRef.secretKey);
      logger.debug("look I'm decrypted " + cryptr.decrypt(iamRef.secretKey));
      logger.debug("My length is " + iamRef.secretKey.length);
      const row = await this.query<any>('INSERT INTO IAMReference SET ?', iamRef);
      return await this.getIamReference(row.insertId);
   }

   public async deleteIamReference(id: number | undefined): Promise<data.IIamReference | null> {
      return (id ? this.query<any>('DELETE FROM IAMReference WHERE id = ?', [id]) : null);
   }

   public async getS3Reference(id: number): Promise<data.IS3Reference> {
      const rows = await this.query<any[]>('SELECT * FROM S3Reference WHERE id = ?', [id]);
      return this.rowToIS3Reference(rows[0]);
   }

   public async makeS3Reference(s3Ref: data.IS3Reference): Promise<data.IS3Reference> {
      const row = await this.query<any>('INSERT INTO S3Reference SET ?', s3Ref);
      return await this.getS3Reference(row.insertId);
   }

   public async deleteS3Reference(id: number | undefined): Promise<data.IS3Reference | null> {
      return (id ? this.query<any>('DELETE FROM S3Reference WHERE id = ?', [id]) : null);
   }

   public async getDbReference(id: number): Promise<data.IDbReference | null> {
      const rows = await this.query<any[]>('SELECT * FROM DBReference WHERE id = ?', [id]);
      return rows.length ? this.rowToIDbReference(rows[0]) : null;
   }

   public async makeDbReference(dbRef: data.IDbReference): Promise<data.IDbReference | null> {
      dbRef.user = cryptr.encrypt(dbRef.user);
      dbRef.pass = cryptr.encrypt(dbRef.pass);
      const row = await this.query<any>('INSERT INTO DBReference SET ?', dbRef);
      return await this.getDbReference(row.insertId);
   }

   public async deleteDbReference(id: number | undefined): Promise<data.IDbReference | null> {
      return (id ? this.query<any>('DELETE FROM DBReference WHERE id = ?', [id]) : null);
   }

   private rowToIEnvironment(row: any): data.IEnvironment {
      return {
         id: row.id,
         name: row.name,
         iamId: row.iamId,
         dbId: row.dbId,
         s3Id: row.s3Id,
      };
   }

   private rowToIEnvironmentFull(row: any): data.IEnvironmentFull {
      return {
         id: row.id,
         envName: row.envName,
         accessKey: cryptr.decrypt(row.accessKey),
         secretKey: cryptr.decrypt(row.secretKey),
         region: row.region,
         dbName: row.dbName,
         host: row.host,
         user: cryptr.decrypt(row.user),
         pass: cryptr.decrypt(row.pass),
         instance: row.instance,
         parameterGroup: row.parameterGroup,
         bucket: row.bucket,
      };
   }

   private rowToIIamReference(row: any): data.IIamReference {
      return {
         id: row.id,
         accessKey: cryptr.decrypt(row.accessKey),
         secretKey: cryptr.decrypt(row.secretKey),
         region: row.region,
      };
   }

   private rowToIDbReference(row: any): data.IDbReference {
      return {
         id: row.id,
         name: row.name,
         host: row.host,
         user: cryptr.decrypt(row.user),
         pass: cryptr.decrypt(row.pass),
         instance: row.instance,
         parameterGroup: row.parameterGroup,
      };
   }

   private rowToIS3Reference(row: any): data.IS3Reference {
      return {
         id: row.id,
         bucket: row.bucket,
      };
   }

   // Keep this function in case we implement any type of basic auth
   private async encrypt(str: string): Promise<any> {
      return new Promise((resolve, reject) => {
         bcrypt.genSalt(saltRounds, (saltErr, salt) => {
            bcrypt.hash(str, salt, (hashErr, hash) => {
               if (hashErr) {
                  reject(hashErr);
               } else {
                  resolve(hash);
               }
            });
         });
      });
   }

   // Keep this function in case we implement any type of basic auth
   private async compareHash(str: string, hash: string): Promise<any> {
      return new Promise((resolve, reject) => {
         bcrypt.compare(str, hash, (compErr, res) => {
            if (compErr) {
               reject(compErr);
            } else {
               resolve(res);
            }
         });
      });
   }
}
