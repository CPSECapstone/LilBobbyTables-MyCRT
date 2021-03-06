import { format } from 'mysql';

import { defaultLogger } from '../logging';
import { ConnectionPool } from './cnnPool';

const logger = defaultLogger(__dirname);

export abstract class Dao {

   constructor(protected pool: ConnectionPool) {
      // constructor is empty because dao classes will share a single ConnectionPool object
   }

   protected async query<T>(queryStr: string, args?: any): Promise<T> {
      const result = await this.pool.query<T>(format(queryStr, args || []));
      return result;
   }

}
