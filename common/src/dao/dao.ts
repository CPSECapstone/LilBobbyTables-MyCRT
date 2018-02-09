import { format } from 'mysql';

import { defaultLogger } from '../logging';
import { ConnectionPool } from './cnnPool';

const logger = defaultLogger(__dirname);

export abstract class Dao {

   constructor(protected pool: ConnectionPool) {

   }

   protected query<T>(queryStr: string, args: any): Promise<T> {
      return this.pool.query<T>(format(queryStr, args));
   }

}