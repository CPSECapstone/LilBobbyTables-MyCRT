import * as data from '../data';
import { ConnectionPool } from './cnnPool';
import { Dao } from './dao';

import { Logging } from '../main';
const logger = Logging.defaultLogger(__dirname);

export class CaptureDao extends Dao {

   // TODO: should we paginate this?
   public async getAllCaptures(user?: data.IUser): Promise<data.ICapture[]> {
      const rawCaptures = user ?
         await this.query<any[]>('SELECT c.*, u.email FROM Capture AS c JOIN User AS u on c.ownerId = u.id ' +
          'WHERE ownerId = ?', [user.id]) :
         await this.query<any[]>('SELECT c.*, u.email FROM Capture AS c JOIN User AS u on c.ownerId = u.id', []);
      return rawCaptures.map(this.rowToICapture);
   }

   public async getCapture(id: number): Promise<data.ICapture | null> {
      const result = await this.query<any[]>('SELECT * FROM Capture AS c JOIN User AS u on c.ownerId = u.id ' +
         'WHERE c.id = ?', [id]);
      if (result.length === 0) {
         return null;
      }
      return this.rowToICapture(result[0]);
   }

   public async getCapturesForEnvironment(envId: number): Promise<data.ICapture[] | null> {
      const rawCaptures = await this.query<any[]>('SELECT * FROM Capture AS c JOIN User AS u on c.ownerId = u.id ' +
         'WHERE envId = ?', [envId]);
      return rawCaptures.map(this.rowToICapture);
   }

   public async getCapturesForEnvByName(envId: number, name: string): Promise<data.ICapture[] | null> {
      const rawCaptures = await this.query<any[]>('SELECT * FROM Capture AS c JOIN User AS u on c.ownerId = u.id ' +
         'WHERE envId = ? AND c.name = ?', [envId, name]);
      if (rawCaptures.length === 0) {
         return null;
      }
      return rawCaptures.map(this.rowToICapture);
   }

   public async getRunningCapturesForEnv(envId: number): Promise<data.ICapture[] | null> {
      const rawCaptures = await this.query<any[]>(
         'SELECT * FROM Capture WHERE envId = ? AND status IN (?, ?, ?)',
         [envId, data.ChildProgramStatus.STARTED, data.ChildProgramStatus.STARTING, data.ChildProgramStatus.RUNNING],
      );
      return rawCaptures.map(this.rowToICapture);
   }

   public async getScheduledCaptures(future: boolean, now: Date): Promise<data.ICapture[] | null> {
      try {
         const when = future ?
            'scheduledStart > ?' :
            'scheduledStart <= ?';
         const rawCaptures = await this.query<any[]>(
            `SELECT * FROM Capture AS c JOIN User AS u on c.ownerId = c.id ` +
            `WHERE scheduledStart IS NOT NULL AND status = "SCHEDULED" AND ${when}`, [now],
         );
         return rawCaptures.map(this.rowToICapture);
      } catch (e) {
         logger.error(e);
         return null;
      }
   }

   public async makeCapture(capture: data.ICapture): Promise<data.ICapture | null> {
      const result = await this.query<any>('INSERT INTO Capture SET ?', {
         name: capture.name,
         ownerId: capture.ownerId,
         status: capture.status,
         envId: capture.envId,
         scheduledStart: capture.scheduledStart,
         scheduledEnd: capture.scheduledEnd,
      });
      return await this.getCapture(result.insertId);
   }

   public async deleteCapture(id: number): Promise<data.ICapture | null> {
      const capture = await this.getCapture(id);
      if (capture === null) {
         return null;
      }
      return this.query<any>('DELETE FROM Capture WHERE id = ?', [id]);
   }

   /**
    * Remove everything from the database. Be VERY CAREFUL with this.
    */
   public async nuke(): Promise<void> {
      await this.query<void>('DELETE FROM Capture');
      await this.query<void>('ALTER TABLE Capture AUTO_INCREMENT = 1');
   }

   public updateCaptureStatus(id: number, status: data.ChildProgramStatus, reason?: string): Promise<void> {
      if (reason) {
         return this.query('UPDATE Capture SET status = ?, reason = ? WHERE id = ?', [status, reason, id]);
      } else {
         return this.query('UPDATE Capture SET status = ? WHERE id = ?', [status, id]);
      }
   }

   public updateCaptureStartTime(id: number): Promise<void> {
      return this.query('UPDATE Capture SET start = NOW() WHERE id = ?', [id]);
   }

   public updateCaptureEndTime(id: number): Promise<void> {
      return this.query('UPDATE Capture SET end = NOW() WHERE id = ?', [id]);
   }

   public updateCaptureName(id: number, name: string): Promise<void> {
      return this.query(`UPDATE Capture SET name = ? where id = ?`, [name, id]);
   }

   private rowToICapture(captureData: any): data.ICapture {
      return {
         id: captureData.id,
         name: captureData.name,
         username: captureData.email,
         start: captureData.start,
         scheduledStart: captureData.scheduledStart,
         scheduledEnd: captureData.scheduledEnd,
         end: captureData.end,
         status: captureData.status,
         envId: captureData.envId,
         type: data.ChildProgramType.CAPTURE,
         reason: captureData.reason,
      };
   }
}
