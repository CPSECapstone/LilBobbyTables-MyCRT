import * as data from '../data';
import { ConnectionPool } from './cnnPool';
import { Dao } from './dao';

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

   public async makeEnvironment(environment: data.IEnvironment): Promise<data.IEnvironment | null> {
      const row = await this.query<any>('INSERT INTO Environment SET ?', environment);
      return await this.getEnvironment(row.insertId);
   }

   public async deleteEnvironment(id: number): Promise<data.IEnvironment> {
      const environment = await this.getEnvironment(id);

      if (environment !== null) {
         // Remove stored DB, S3, and IAM references associated with the environment
         await this.deleteDbReference(environment.dbId);
         await this.deleteIamReference(environment.iamId);
         await this.deleteS3Reference(environment.s3Id);
         // Delete captures associated with the environment
         await this.query<any[]>('DELETE FROM Capture WHERE envId = ?', [id]);
      }

      return this.query<any>('DELETE FROM Environment WHERE id = ?', [id]);
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

   public async getDbReference(id: number): Promise<data.IDbReference> {
      const rows = await this.query<any[]>('SELECT * FROM DBReference WHERE id = ?', [id]);
      return this.rowToIDbReference(rows[0]);
   }

   public async makeDbReference(dbRef: data.IDbReference): Promise<data.IDbReference> {
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
      };
   }

   private rowToIS3Reference(row: any): data.IS3Reference {
      return {
         id: row.id,
         bucket: row.bucket,
      };
   }

}
