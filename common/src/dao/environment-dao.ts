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

   public async getEnvironmentFull(id: number): Promise<data.IEnvironmentFull | null> {
      const slct1 = 'SELECT e.name AS envName, d.name AS dbName, host, user, pass, instance, ';
      const slct2 = 'parameterGroup, bucket, accessKey, secretKey, region ';
      const from1 = 'FROM Environment AS e JOIN DBReference AS d ON e.dbId = d.id ';
      const from2 = 'JOIN S3Reference AS s ON e.S3Id = s.id JOIN IAMReference AS i ON e.iamId = i.id ';
      const where = 'WHERE e.id = ?';

      const rows = await this.query<any[]>(slct1.concat(slct2).concat(from1).concat(from2).concat(where), [id]);
      return this.rowToIEnvironmentFull(rows[0]);
   }

   public async makeEnvironment(environment: data.IEnvironment): Promise<data.IEnvironment | null> {
      const row = await this.query<any>('INSERT INTO Environment SET ?', environment);
      return await this.getEnvironment(row.insertId);
   }

   public async deleteEnvironment(id: number): Promise<data.ICapture> {
      const row1 = 'DELETE e.*, c.*, r.* FROM Environment e LEFT JOIN Capture c ON e.id = c.envId LEFT JOIN Replay r';
      const row2 = ' ON r.captureId = c.id WHERE e.id = ?';
      return this.query<any>(row1.concat(row2), [id]);
   }

   public async getIamReference(id: number): Promise<data.IIamReference> {
      const rows = await this.query<any[]>('SELECT * FROM IAMReference WHERE id = ?', [id]);
      return this.rowToIIamReference(rows[0]);
   }

   public async makeIamReference(iamRef: data.IIamReference): Promise<data.IIamReference> {
      const row = await this.query<any>('INSERT INTO IAMReference SET ?', iamRef);
      return await this.getIamReference(row.insertId);
   }

   public async getS3Reference(id: number): Promise<data.IS3Reference> {
      const rows = await this.query<any[]>('SELECT * FROM S3Reference WHERE id = ?', [id]);
      return this.rowToIS3Reference(rows[0]);
   }

   public async makeS3Reference(s3Ref: data.IS3Reference): Promise<data.IS3Reference> {
      const row = await this.query<any>('INSERT INTO S3Reference SET ?', s3Ref);
      return await this.getS3Reference(row.insertId);
   }

   public async getDbReference(id: number): Promise<data.IDbReference> {
      const rows = await this.query<any[]>('SELECT * FROM DBReference WHERE id = ?', [id]);
      return this.rowToIDbReference(rows[0]);
   }

   public async makeDbReference(dbRef: data.IDbReference): Promise<data.IDbReference> {
      const row = await this.query<any>('INSERT INTO DBReference SET ?', dbRef);
      return await this.getDbReference(row.insertId);
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
      };
   }

   private rowToIS3Reference(row: any): data.IS3Reference {
      return {
         id: row.id,
         bucket: row.bucket,
      };
   }

}
