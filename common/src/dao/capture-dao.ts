import * as data from '../data';
import { ConnectionPool } from './cnnPool';
import { Dao } from './dao';

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

   public async makeCapture(capture: data.ICapture): Promise<data.ICapture | null> {
      const result = await this.query<any>('INSERT INTO Capture SET ?', {
         name: capture.name,
         status: capture.status,
      });
      return await this.getCapture(result.insertId);
   }

   public deleteCapture(id: number): Promise<data.ICapture> {
       // tslint:disable-next-line:max-line-length
       return this.query<any>('DELETE c.*, r.* from Capture c LEFT JOIN Replay r on r.captureId = c.id where c.id = ?', [id]);
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
         end: captureData.end,
         status: captureData.status,
         type: data.ChildProgramType.CAPTURE,
      };
   }
}
