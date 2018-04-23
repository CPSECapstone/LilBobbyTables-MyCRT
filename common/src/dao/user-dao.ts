import { IEnvironmentUser, IUser } from '../data';
import { defaultLogger } from '../logging';
import { Dao } from './dao';

const logger = defaultLogger(__dirname);

export class UserDao extends Dao {

   public async getAllUsers(): Promise<IUser[] | null> {
      try {
         const rawUsers = await this.query<any[]>('SELECT * FROM User', []);
         return rawUsers.map(this.rowToIUser);
      } catch (e) {
         logger.error(e);
         return null;
      }
   }

   public async getUser(id: number): Promise<IUser | null> {
      const result = await this.query<any[]>('SELECT * FROM User WHERE id = ?', [id]);
      if (result.length === 0) {
         return null;
      }
      return this.rowToIUser(result[0]);
   }

   public async makeUser(user: IUser): Promise<IUser | null> {
      try {
         const result = await this.query<any>('INSERT INTO User SET ?', {
            id: user.id,
            isAdmin: user.isAdmin ? 1 : 0,
         });
         return await this.getUser(result.insertId);
      } catch (e) {
         logger.error(e);
         return null;
      }
   }

   public async deleteUser(id: number): Promise<IUser | null> {
      const user = await this.getUser(id);
      if (user === null) {
         return null;
      }
      return this.query<any>('DELETE FROM User WHERE id = ?', [id]);
   }

   public async nuke(): Promise<void> {
      await this.query<void>('DELETE FROM User');
      await this.query<void>('ALTER TABLE User AUTO_INCREMENT = 1');
   }

   private rowToIUser(row: any): IUser {
      return {
         ...row,
         isAdmin: !!row.isAdmin,
      };
   }

   private rowToIEnvironmentUser(row: any): IEnvironmentUser {
      return {
         ...row,
         isAdmin: !!row.isAdmin,
      };
   }

}
