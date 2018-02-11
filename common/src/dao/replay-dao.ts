import * as data from '../data';
import { ConnectionPool } from './cnnPool';
import { Dao } from './dao';

export class ReplayDao extends Dao {

   public async getAllReplays(): Promise<data.IReplay[]> {
      const rawReplays = await this.query<any[]>('SELECT * FROM Replay', []);
      return rawReplays.map(this.resultToIReplay);
   }

   public async getReplay(id: number): Promise<data.IReplay> {
      const result = await this.query<any[]>('SELECT * FROM Replay WHERE id = ?', [id]);
      return this.resultToIReplay(result[0]);
   }

   public async makeReplay(replay: data.IReplay): Promise<data.IReplay> {
      const result = await this.query<any>('INSERT INTO Replay SET ?', {
         name: replay.name,
         status: replay.status,
         captureId: replay.captureId,
      });
      return await this.getReplay(result.insertId);
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
         name: replayData.name,
         start: replayData.start,
         end: replayData.end,
         status: replayData.status,
         type: data.ChildProgramType.REPLAY,
      };
   }
}
