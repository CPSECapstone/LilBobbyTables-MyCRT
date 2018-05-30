import * as data from '../data';
import { defaultLogger } from '../logging';
import settings = require('../settings');
import { ConnectionPool } from './cnnPool';
import { Dao } from './dao';

import bcrypt = require('bcrypt');
const saltRounds = 10;
import Cryptr = require('cryptr');
const cryptr = new Cryptr(settings.settings.encryptionKey); // using aes256 encryption algorithm
import { Logging } from '../main';
const logger = Logging.defaultLogger(__dirname);

export  class EnvironmentDao extends Dao {

   public async getAllEnvironments(user?: data.IUser): Promise<data.IEnvironment[]> {
      const environmentRows = user ?
         await this.query<any[]>('SELECT e.*, u.isAdmin, u.email FROM Environment AS e '
            + ' JOIN User as u ON e.ownerId = u.id WHERE ownerId = ?',
            [user.id]) :
         await this.query<any[]>('SELECT * FROM Environment AS e JOIN User as u ON e.ownerId = u.id', []);
      return environmentRows.map(this.rowToIEnvironment);
   }

   public async getEnvironmentByName(name: string, user?: data.IUser): Promise<data.IEnvironment | null> {
      const rows = user ?
         await this.query<any[]>('SELECT e.*, u.isAdmin, u.email FROM Environment AS e '
            + ' JOIN User as u ON e.ownerId = u.id WHERE name = ? AND ownerId = ?', [name, user.id]) :
         await this.query<any[]>('SELECT e.*, u.isAdmin, u.email FROM Environment AS e '
            + ' JOIN User as u ON e.ownerId = u.id WHERE e.name = ?',
            [name])
      ;
      if (rows.length === 0) {
         return null;
      }
      return this.rowToIEnvironment(rows[0]);
   }

   public async getEnvironment(id: number): Promise<data.IEnvironment | null> {
      const rows =
         await this.query<any[]>('SELECT e.*, u.isAdmin, u.email FROM Environment AS e '
            + ' JOIN User as u ON e.ownerId = u.id WHERE e.id = ?',
            [id]);

      if (rows.length === 0) {
         return null;
      }
      return this.rowToIEnvironment(rows[0]);
   }

   public async getEnvironmentFull(id: number): Promise<data.IEnvironmentFull | null> {
      const queryStr = 'SELECT e.id, e.name AS envName, e.ownerId AS ownerId, u.email, ' +
         'd.name AS dbName, host, user, pass, instance, parameterGroup, ' +
         'bucket, prefix, accessKey, secretKey, region, a.name as keysName, a.id as keysId ' +
         'FROM Environment AS e JOIN DBReference AS d ON e.dbId = d.id ' +
         'JOIN S3Reference AS s ON e.S3Id = s.id JOIN AwsKeys AS a ON e.awsKeysId = a.id ' +
         'JOIN User AS u ON e.ownerId = u.id ' +
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
         await this.deleteAwsKeys(environment.awsKeysId);
         await this.deleteS3Reference(environment.s3Id);
         await this.query<any[]>('DELETE FROM Capture WHERE envId = ?', [id]);
         return this.query<any>('DELETE FROM Environment WHERE id = ?', [id]);
      } else {
         return null;
      }
   }

   public async getSlackConfig(slackId: number): Promise<data.ISlackConfig | null> {
      const row = await this.query<any>('SELECT * FROM SlackConfig WHERE id = ?', [slackId]);
      return this.rowToSlackConfig(row[0]);
   }

   public async getSlackConfigByEnv(envId: number): Promise<data.ISlackConfig | null> {
      const rows = await this.query<any>('SELECT * FROM SlackConfig WHERE environmentId = ?', envId);
      if (rows.length === 0) {
         return null;
      }
      return this.rowToSlackConfig(rows[0]);
   }

   public async makeSlackConfig(slackConfig: data.ISlackConfig): Promise<data.ISlackConfig | null> {
      const row = await this.query<any>('INSERT INTO SlackConfig SET ?', slackConfig);
      return await this.getSlackConfig(row.insertId);
   }

   public async editSlackConfig(envId: number, changes: data.ISlackConfig): Promise<data.ISlackConfig | null> {
      return this.query<any>('UPDATE SlackConfig SET ? WHERE environmentId = ?', [changes, envId]);
   }

   public async deleteSlackConfig(slackId: number): Promise<data.ISlackConfig | null> {
      return this.query<any>('DELETE FROM SlackConfig WHERE id = ?', [slackId]);
   }

   /**
    * Remove everything from the database. Be VERY CAREFUL with this.
    */
   public async nuke(): Promise<void> {
      ['Environment', 'AwsKeys', 'S3Reference', 'DBReference'].forEach(async (table) => {
         await this.query<void>(`DELETE FROM ${table}`);
         await this.query<void>(`ALTER TABLE ${table} AUTO_INCREMENT = 1`);
      });
   }

   public async editEnvironment(id: number, changes: data.IEnvironment): Promise<data.IEnvironment | null> {
      return this.query<any>('UPDATE Environment SET ? WHERE id = ?', [changes, id]);
   }

   public async getAllAwsKeys(user?: data.IUser): Promise<data.IAwsKeys[]> {
      const keysRows = user ?
         await this.query<any[]>('SELECT * FROM AwsKeys WHERE userId = ?', [user.id]) :
         await this.query<any[]>('SELECT * FROM AwsKeys', []);

      return keysRows.map(this.rowToAwsKeys);
   }

   public async getAllAwsKeysByName(name: string, user?: data.IUser): Promise<data.IAwsKeys | null> {
      const keysRows = user ?
         await this.query<any[]>('SELECT * FROM AwsKeys WHERE userId = ? AND name = ?', [user.id, name]) :
         await this.query<any[]>('SELECT * FROM AwsKyes WHERE name = ?', [name]);

      if (keysRows.length === 0) {
            return null;
      }
      return this.rowToAwsKeys(keysRows[0]);
   }

   public async getAwsKeys(id: number): Promise<data.IAwsKeys | null> {
      const rows = await this.query<any[]>('SELECT * FROM AwsKeys WHERE id = ?', [id]);
      return rows.length ? this.rowToAwsKeys(rows[0]) : null;
   }

   public async makeAwsKeys(awsKeys: data.IAwsKeys): Promise<data.IAwsKeys | null> {
      awsKeys.accessKey = cryptr.encrypt(awsKeys.accessKey);
      awsKeys.secretKey = cryptr.encrypt(awsKeys.secretKey);
      const row = await this.query<any>('INSERT INTO AwsKeys SET ?', awsKeys);
      return await this.getAwsKeys(row.insertId);
   }

   public async deleteAwsKeys(id: number | undefined): Promise<data.IAwsKeys | null> {
      return (id ? this.query<any>('DELETE FROM AwsKeys WHERE id = ?', [id]) : null);
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
         ownerId: row.ownerId,
         awsKeysId: row.awsKeysId,
         dbId: row.dbId,
         s3Id: row.s3Id,
         username: row.email,
      };
   }

   private rowToIEnvironmentFull(row: any): data.IEnvironmentFull {
      return {
         id: row.id,
         envName: row.envName,
         ownerId: row.ownerId,
         username: row.email,
         keysId: row.keysId,
         keysName: row.keysName,
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
         prefix: row.prefix,
      };
   }

   private rowToAwsKeys(row: any): data.IAwsKeys {
      return {
         id: row.id,
         accessKey: cryptr.decrypt(row.accessKey),
         secretKey: cryptr.decrypt(row.secretKey),
         region: row.region,
         name: row.name,
         userId: row.userId,
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
         prefix: row.prefix,
      };
   }

   private rowToSlackConfig(row: any): data.ISlackConfig {
      return {
         id: row.id,
         channel: row.channel,
         environmentId: row.environmentId,
         token: row.token,
         isOn: !!row.isOn,
      };
   }
}
