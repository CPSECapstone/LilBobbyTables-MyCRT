import * as data from '../data';
import { ConnectionPool } from './cnnPool';
import { Dao } from './dao';

export class CaptureDao extends Dao {

   // TODO: should we paginate this?
   public async getAllCaptures(): Promise<data.ICapture[]> {
      const rawCaptures = await this.query<any[]>('SELECT * FROM Capture', []);
      return rawCaptures.map(this.resultToICapture);
   }

   public async getCapture(id: number): Promise<data.ICapture> {
      const result = await this.query<data.ICapture[]>('SELECT * FROM Capture WHERE id = ?', [id]);
      return this.resultToICapture(result[0]);
   }

   public async makeCapture(capture: data.ICapture): Promise<data.ICapture> {
      const result = await this.query<any>('INSERT INTO Capture SET ?', {
         name: capture.name,
         status: capture.status,
      });
      return await this.getCapture(result.insertId);
   }

   private resultToICapture(captureData: any): data.ICapture {
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
