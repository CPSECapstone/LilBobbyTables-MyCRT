import * as crypto from 'crypto';

import { IEnvironment, IEnvironmentUser, IEnvironmentUser as Invite, IUser } from '../data';
import { defaultLogger } from '../logging';
import { ConnectionPool } from './cnnPool';
import { Dao } from './dao';
import { EnvironmentDao } from './environment-dao';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

const logger = defaultLogger(__dirname);

export interface IEnvironmentMember {
   id: number;
   userId: number;
   email: string;
   isMember: boolean;
   isAdmin: boolean;
}

export class EnvironmentInviteDao extends Dao {

   public async getInvite(id: number): Promise<Invite | null> {
      const rows = await this.query<any[]>('SELECT * FROM EnvironmentUser WHERE id = ?', [id]);
      if (rows.length < 1) {
         return null;
      }
      return this.rowToInvite(rows[0]);
   }

   public async delInvite(id: number): Promise<any | null> {
      const delInvite = await this.query<any>('DELETE FROM EnvironmentUser WHERE id = ?', [id]);
      return delInvite;
   }

   public async getInviteByCode(code: string): Promise<Invite | null> {
      const rows = await this.query<any[]>('SELECT * from EnvironmentUser WHERE inviteCode = ?',
         [code]);
      if (rows.length < 1) {
         return null;
      }
      return this.rowToInvite(rows[0]);
   }

   public async inviteUser(environment: IEnvironment, user: IUser, isAdminUser: boolean): Promise<Invite | null> {
      const inviteCode = crypto.randomBytes(4).toString('hex');
      const invite: Invite = {
         environmentId: environment.id,
         userId: user.id,
         isAdmin: isAdminUser,
         inviteCode,
         accepted: false, // set to true by the user
         createdAt: new Date().getTime(),
      };
      const result = await this.query<any>('INSERT INTO EnvironmentUser SET ?', [invite]);
      return await this.getInvite(result.insertId);
   }

   public async acceptInvite(invite: Invite) {
      const now = new Date().getTime();
      if (now - invite.createdAt! > MS_PER_DAY) {
         throw new Error("This invite has expired");
      }
      await this.query('UPDATE EnvironmentUser SET accepted = 1, acceptedAt = ? WHERE id = ?', [now, invite.id]);
      return;
   }

   public async promoteToAdmin(envUserId: number): Promise<any> {
      const updateRow = await this.query('UPDATE EnvironmentUser SET isAdmin = 1 WHERE id = ?', [envUserId]);
      return updateRow;
   }

   public async getUserMembership(user: IUser, environment: IEnvironment):
         Promise<IEnvironmentMember> {

      let isMember = false;
      let isAdmin = false;
      let envUserId = 0;

      if (environment.ownerId === user.id) {
         logger.info('User owns the environment');
         isMember = true;
         isAdmin = true;
      } else {
         const query = 'SELECT id, userId, isAdmin FROM EnvironmentUser WHERE userId = ? '
            + 'AND environmentId = ? AND accepted = 1';
         const rows = await this.query<any[]>(query, [user.id, environment.id]);
         if (rows.length > 0) {
            logger.info("Found an invite");
            isMember = true;
            isAdmin = !!(rows[0].isAdmin);
            envUserId = rows[0].id;
         } else {
            logger.info("No membership");
         }
      }

      return {
         id: envUserId,
         userId: user.id!,
         email: user.email!,
         isMember,
         isAdmin,
      };

   }

   public async getAllEnvironmentsWithMembership(user: IUser): Promise<IEnvironment[]> {
      const invited = await this.query<any[]>(
         'SELECT e.*, u.email FROM Environment AS e JOIN EnvironmentUser AS eu ON e.id = eu.environmentId ' +
         'JOIN User AS u ON e.ownerId = u.id WHERE eu.accepted = 1 AND eu.userId = ?', [user.id]);

      return invited.map(this.rowtoIEnvironment);
   }

   public async getEnvUserCount(environment: IEnvironment): Promise<any> {
      const envUserCt = await this.query<any>('SELECT COUNT(*) AS count FROM EnvironmentUser WHERE environmentId = ?',
         [environment.id!]);

      return envUserCt[0];
   }

   public async getEnvUsers(environment: IEnvironment): Promise<IEnvironmentUser[] | null> {
      const rows = await this.query<any[]>('SELECT u.email, u.id AS userId, eu.isAdmin, eu.acceptedAt ' +
         'FROM EnvironmentUser AS eu JOIN User AS u ON eu.userId = u.id ' +
         'WHERE eu.accepted = 1 AND eu.environmentId = ?', [environment.id!]);

      if (rows.length === 0) {
         return null;
      }
      return rows.map(this.rowToIEnvironmentUser);
   }

   private rowtoIEnvironment(row: any): IEnvironment {
      return {...row};
   }

   private rowToIEnvironmentUser(row: any): IEnvironmentUser {
      return {
         userId: row.userId,
         isAdmin: !!row.isAdmin,
         username: row.email,
         acceptedAt: row.acceptedAt,
      };
   }

   private rowToInvite(row: any) {
      return {
         ...row,
         isAdmin: !!row.isAdmin,
         accepted: !!row.accepted,
      };
   }
}
