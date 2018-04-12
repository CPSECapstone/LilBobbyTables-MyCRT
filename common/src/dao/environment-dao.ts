import * as data from '../data';
import { defaultLogger } from '../logging';
import { ConnectionPool } from './cnnPool';
import { Dao } from './dao';

const logger = defaultLogger(__dirname);

export class EnvironmentDao extends Dao {

   public async getAllEnvironments(): Promise<data.IEnvironment[]> {
      const environmentRows = await this.query<any[]>('SELECT * FROM Environment', []);
      return environmentRows.map(this.rowToIEnvironment);
   }

   public async getEnvironmentByName(name: string): Promise<data.IEnvironment | null> {
      const rows = await this.query<any[]>('SELECT * FROM Environment WHERE name = ?', [name]);
      if (rows.length === 0) {
         return null;
      }
      return this.rowToIEnvironment(rows[0]);
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
         // Remove stored DB, S3, and IAM references associated with the environment
         await this.deleteDbReference(environment.dbId);
         await this.deleteIamReference(environment.iamId);
         await this.deleteS3Reference(environment.s3Id);
         // Delete captures associated with the environment
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
         accessKey: row.accessKey,
         secretKey: row.secretKey,
         region: row.region,
         dbName: row.dbName,
         host: row.host,
         user: row.user,
         pass: row.pass,
         instance: row.instance,
         parameterGroup: row.parameterGroup,
         bucket: row.bucket,
      };
   }

   private rowToIIamReference(row: any): data.IIamReference {
      return {
         id: row.id,
         accessKey: row.accessKey,
         secretKey: row.secretKey,
         region: row.region,
      };
   }

   private rowToIDbReference(row: any): data.IDbReference {
      return {
         id: row.id,
         name: row.name,
         host: row.host,
         user: row.user,
         pass: row.pass,
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

}
