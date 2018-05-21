import * as crypto from 'crypto';

import { IEnvironment, IEnvironmentUser as Invite, IUser } from '../data';
import { defaultLogger } from '../logging';
import { ConnectionPool } from './cnnPool';
import { Dao } from './dao';
import { EnvironmentDao } from './environment-dao';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

const logger = defaultLogger(__dirname);

export interface IEnvironmentMember {
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
         isAdmin: isAdminUser, // for now, might use later
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
      await this.query('UPDATE EnvironmentUser SET accepted = 1 WHERE id = ?', [invite.id]);
      return;
   }

   public async getUserMembership(user: IUser, environment: IEnvironment):
         Promise<IEnvironmentMember> {

      let isMember = false;
      let isAdmin = false;

      // If the user created the environment
      if (environment.ownerId === user.id) {
         logger.info('User owns the environment');
         isMember = true;
         isAdmin = true;
      } else {
         // otherwise, they were added through invite
         const query = 'SELECT userId, isAdmin FROM EnvironmentUser WHERE userId = ? '
            + 'AND environmentId = ? AND accepted = 1';
         const rows = await this.query<any[]>(query, [user.id, environment.id]);
         if (rows.length > 0) {
            logger.info("Found an invite");
            isMember = true;
            isAdmin = !!(rows[0].isAdmin);
         } else {
            logger.info("No membership");
         }
      }

      return {
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

   private rowtoIEnvironment(row: any): IEnvironment {
      return {...row};
   }

   private rowToInvite(row: any) {
      return {
         ...row,
         isAdmin: !!row.isAdmin,
         accepted: !!row.accepted,
      };
   }
}
