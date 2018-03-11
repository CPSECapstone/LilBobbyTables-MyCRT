import * as data from '../data';
import { ConnectionPool } from './cnnPool';
import { Dao } from './dao';

import { Logging } from '../main';
const logger = Logging.defaultLogger(__dirname);

export class CaptureDao extends Dao {

   // TODO: should we paginate this?
   public async getAllCaptures(): Promise<data.ICapture[]> {
      const rawCaptures = await this.query<any[]>('SELECT * FROM Capture', []);
      return rawCaptures.map(this.rowToICapture);
   }

   public async getCapture(id: number): Promise<data.ICapture | null> {
      const result = await this.query<any[]>('SELECT * FROM Capture WHERE id = ?', [id]);
      if (result.length === 0) {
         return null;
      }
      return this.rowToICapture(result[0]);
   }

   public async getCapturesForEnvironment(envId: number): Promise<data.ICapture[] | null> {
      const rawCaptures = await this.query<any[]>('SELECT * FROM Capture WHERE envId = ?', [envId]);
      return rawCaptures.map(this.rowToICapture);
   }

   public async getRunningCapturesForEnv(envId: number): Promise<data.ICapture[] | null> {
      const rawCaptures = await this.query<any[]>(
         'SELECT * FROM Capture WHERE envId = ? AND status IN (?, ?, ?)',
         [envId, data.ChildProgramStatus.STARTED, data.ChildProgramStatus.STARTING, data.ChildProgramStatus.RUNNING],
      );
      return rawCaptures.map(this.rowToICapture);
   }

   public async makeCapture(capture: data.ICapture): Promise<data.ICapture | null> {
      const result = await this.query<any>('INSERT INTO Capture SET ?', {
         name: capture.name,
         status: capture.status,
         envId: capture.envId,
         scheduledStart: capture.scheduledStart,
      });
      return await this.getCapture(result.insertId);
   }

   public async deleteCapture(id: number): Promise<data.ICapture> {
      return this.query<any>('DELETE FROM Capture WHERE id = ?', [id]);
   }

   /**
    * Remove everything from the database. Be VERY CAREFUL with this.
    */
   public async nuke(): Promise<void> {
      await this.query<void>('DELETE FROM Capture');
      await this.query<void>('ALTER TABLE Capture AUTO_INCREMENT = 1');
   }

   public updateCaptureStatus(id: number, status: data.ChildProgramStatus): Promise<void> {
      return this.query('UPDATE Capture SET status = ? WHERE id = ?', [status, id]);
   }

   public updateCaptureStartTime(id: number): Promise<void> {
      return this.query('UPDATE Capture SET start = NOW() WHERE id = ?', [id]);
   }

   public updateCaptureEndTime(id: number): Promise<void> {
      return this.query('UPDATE Capture SET end = NOW() WHERE id = ?', [id]);
   }

   private rowToICapture(captureData: any): data.ICapture {
      return {
         id: captureData.id,
         name: captureData.name,
         start: captureData.start,
         scheduledStart: captureData.scheduledStart,
         end: captureData.end,
         status: captureData.status,
         envId: captureData.envId,
         type: data.ChildProgramType.CAPTURE,
      };
   }
}
