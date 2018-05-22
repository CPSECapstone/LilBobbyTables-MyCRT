import { defaultLogger } from '../logging';

import * as data from '../data';
import { ConnectionPool } from './cnnPool';
import { Dao } from './dao';

const logger = defaultLogger(__dirname);

export class ReplayDao extends Dao {

   public async getAllReplays(user?: data.IUser): Promise<data.IReplay[]> {
      const rawReplays = user ?
         await this.query<any[]>('SELECT * FROM Replay AS r JOIN User AS u ON r.ownerId = u.id ' +
            'WHERE ownerId = ?', [user.id]) :
         await this.query<any[]>('SELECT * FROM Replay AS r JOIN User AS u ON r.ownerId = u.id', []);
      return rawReplays.map(this.resultToIReplay);
   }

   public async getReplay(id: number): Promise<data.IReplay | null> {
      const result = await this.query<any[]>('SELECT * FROM Replay AS r JOIN User AS u ON r.ownerId = u.id ' +
         'WHERE r.id = ?', [id]);
      if (result.length === 0) {
         return null;
      }
      return this.resultToIReplay(result[0]);
   }

   public async getReplaysForCapture(captureId: number): Promise<data.IReplay[]> {
      const rawReplays = await this.query<any[]>('SELECT * FROM Replay AS r JOIN User AS u ON r.ownerId = u.id ' +
         'WHERE captureId = ?', [captureId]);
      return rawReplays.map(this.resultToIReplay);
   }

   public async getReplaysForCapByName(captureId: number, name: string): Promise<data.IReplay[] | null> {
      const rawReplays = await this.query<any[]>('SELECT * FROM Replay AS r JOIN User AS u ON r.ownerId = u.id ' +
         'WHERE captureId = ? and r.name = ?',
         [captureId, name]);
      if (rawReplays.length === 0) {
         return null;
      }
      return rawReplays.map(this.resultToIReplay);
   }

   public async anyReplaysCurrentlyOnDb(name: string, host: string): Promise<boolean> {
      const query = "SELECT COUNT(*) AS count FROM Replay AS r JOIN DBReference AS db ON r.dbId = db.id "
         + " WHERE r.status in ('SCHEDULED', 'STARTED', 'STARTING', 'RUNNING', 'STOPPING') "
         + " AND db.name = ? AND db.host = ?";
      const countRow = (await this.query<any[]>(query, [name, host]))[0];
      const count: number = parseInt(countRow.count);
      return count > 0;
   }

   public async getAbandonedReplays(): Promise<data.IReplay[] | null> {
      const status = data.ChildProgramStatus;
      try {
         const rawReplays = await this.query<any[]>(
            `SELECT * FROM Replay WHERE status IN (?, ?, ?, ?)`,
            [status.STARTED, status.STARTING, status.RUNNING, status.STOPPING],
         );
         return rawReplays.map(this.resultToIReplay);
      } catch (e) {
         logger.error(e);
         return null;
      }
   }

   public async makeReplay(replay: data.IReplay): Promise<data.IReplay | null> {
      const result = await this.query<any>('INSERT INTO Replay SET ?', {
         name: replay.name,
         ownerId: replay.ownerId,
         status: replay.status,
         captureId: replay.captureId,
         dbId: replay.dbId,
         scheduledStart: replay.scheduledStart,
      });
      return await this.getReplay(result.insertId);
   }

   public async deleteReplay(id: number): Promise<data.IReplay | null> {
      const replay = await this.getReplay(id);
      if (replay === null) {
         return null;
      }
      return this.query<any>('DELETE FROM Replay WHERE id = ?' , [id]);
   }

   /**
    * Remove everything from the database. Be VERY CAREFUL with this.
    */
   public async nuke(): Promise<void> {
      await this.query<void>('DELETE FROM Replay');
      await this.query<void>('ALTER TABLE Replay AUTO_INCREMENT = 1');
   }

   public updateReplayStatus(id: number, status: data.ChildProgramStatus, reason?: string): Promise<void> {
      if (reason) {
         return this.query('UPDATE Replay SET status = ?, reason = ? WHERE id = ?', [status, reason, id]);
      } else {
         return this.query('UPDATE Replay SET status = ? WHERE id = ?', [status, id]);
      }
   }

   public updateReplayName(id: number, name: string): Promise<void> {
      return this.query('UPDATE Replay SET name = ? WHERE id = ?', [name, id]);
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
         username: replayData.email,
         start: replayData.start,
         end: replayData.end,
         status: replayData.status,
         type: data.ChildProgramType.REPLAY,
         reason: replayData.reason,
      };
   }
}
