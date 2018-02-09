import * as mysql from 'mysql';

import { defaultLogger } from '../logging';

const logger = defaultLogger(__dirname);

export class ConnectionPool {

   protected pool: mysql.Pool;

   constructor(config: mysql.PoolConfig) {
      this.pool = mysql.createPool(config);
   }

   public query<T>(query: string): Promise<T> {
      return new Promise<T>((resolve, reject) => {
         this.pool.getConnection((connErr, conn) => {
            if (connErr) {
               logger.error(`Error getting connection: ${connErr}`);
               reject(connErr);
            } else {
               conn.query(query, (queryErr, results, fields) => {
                  conn.release();
                  if (queryErr) {
                     logger.error(`Error making query: ${queryErr}`);
                     reject(queryErr);
                  } else {
                     resolve(results as T);
                  }
               });
            }
         });
      });
   }

}
