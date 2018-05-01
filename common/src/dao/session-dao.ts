import { ISession, IUser } from '../data';
import { defaultLogger } from '../logging';
import { Dao } from './dao';

const logger = defaultLogger(__dirname);

export class SessionDao extends Dao {

   public async getUserWithToken(token: string): Promise<IUser | null> {
      try {
         const rows = await this.query<any[]>('SELECT * FROM User where sessionToken = ?', [token]);
         return rows.length < 1 ? null : this.rowToIUser(rows[0]);
      } catch (e) {
         logger.error('Could not get User by session token');
         logger.error(JSON.stringify(e));
         return null;
      }
   }

   public async getSessionForUser(user: IUser): Promise<ISession | null> {
      try {
         const rows = await this.query<any[]>('SELECT sessionToken, loginTime, lastTokenCheck '
            + 'FROM User where id = ?', [user.id]);
         return rows.length < 1 ? null : this.rowToISession(rows[0]);
      } catch (e) {
         logger.error(`Could not get the session for user ${user.id}`);
         logger.error(JSON.stringify(e));
         return null;
      }
   }

   public beginSession(user: IUser, token: string) {
      const now = new Date().getTime();
      return this.query('UPDATE User SET sessionToken = ?, loginTime = ?, lastTokenCheck = ? '
         + 'WHERE id = ?', [token, now, now, user.id]);
   }

   public async clearSession(user: IUser) {
      return this.query('UPDATE User SET sessionToken = NULL, loginTime = NULL, '
         + 'lastTokenCheck = NULL WHERE id = ?', [user.id]);
   }

   public async updateSession(user: IUser): Promise<ISession | null> {
      const now = new Date().getTime();
      await this.query('UPDATE User SET lastTokenCheck = ? WHERE id = ?', [now, user.id]);
      return await this.getSessionForUser(user);
   }

   private rowToIUser(row: any): IUser {
      return {
         ...row,
         isAdmin: !!row.isAdmin,
      };
   }

   private rowToISession(row: any): ISession {
      return {...row};
   }

}
