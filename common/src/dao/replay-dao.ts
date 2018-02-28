import * as data from '../data';
import { ConnectionPool } from './cnnPool';
import { Dao } from './dao';

export class ReplayDao extends Dao {

   public async getAllReplays(): Promise<data.IReplay[]> {
      const rawReplays = await this.query<any[]>('SELECT * FROM Replay', []);
      return rawReplays.map(this.resultToIReplay);
   }

   public async getReplay(id: number): Promise<data.IReplay | null> {
      const result = await this.query<any[]>('SELECT * FROM Replay WHERE id = ?', [id]);
      if (result.length === 0) {
         return null;
      }
      return this.resultToIReplay(result[0]);
   }

   public async getReplaysForCapture(captureId: number): Promise<data.IReplay[]> {
      const rawReplays = await this.query<any[]>('SELECT * FROM Replay WHERE captureId = ?', [captureId]);
      return rawReplays.map(this.resultToIReplay);
   }

   public async makeReplay(replay: data.IReplay): Promise<data.IReplay | null> {
      const result = await this.query<any>('INSERT INTO Replay SET ?', {
         name: replay.name,
         status: replay.status,
         captureId: replay.captureId,
         dbId: replay.dbId,
      });
      return await this.getReplay(result.insertId);
   }

   public async deleteReplay(id: number): Promise<data.IReplay> {
      return this.query<any>('DELETE FROM Replay WHERE id = ?' , [id]);
   }

   /**
    * Remove everything from the database. Be VERY CAREFUL with this.
    */
   public async nuke(): Promise<void> {
      await this.query<void>('DELETE FROM Replay');
      await this.query<void>('ALTER TABLE Replay AUTO_INCREMENT = 1');
   }

   public updateReplayStatus(id: number, status: data.ChildProgramStatus): Promise<void> {
      return this.query('UPDATE Replay SET status = ? WHERE id = ?', [status, id]);
   }

   public updateReplayStartTime(id: number): Promise<void> {
      return this.query('UPDATE Replay SET start = NOW() WHERE id = ?', [id]);
   }

   public updateReplayEndTime(id: number): Promise<void> {
      return this.query('UPDATE Replay SET end = NOW() WHERE id = ?', [id]);
   }

   private resultToIReplay(replayData: any): data.IReplay {
      return {
         id: replayData.id,
         captureId: replayData.captureId,
         dbId: replayData.dbId,
         name: replayData.name,
         start: replayData.start,
         end: replayData.end,
         status: replayData.status,
         type: data.ChildProgramType.REPLAY,
      };
   }
}
