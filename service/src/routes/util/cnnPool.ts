import { Logging } from '@lbt-mycrt/common';
import { NextFunction, Response } from 'express';
import * as http from 'http-status-codes';
import * as mysql from 'mysql';
import { MysqlError, Pool, PoolConnection, Query } from 'mysql';
import { List } from 'underscore';

const logger = Logging.defaultLogger(__dirname);
export declare type CallbackFunction = (error: MysqlError | null, results: any, fields: any) => void;

export default class ConnectionPool {

   public static singleton: ConnectionPool = new ConnectionPool(require('../../../db/config.json'), 1);
   public static query(response: Response, query: string, callback: CallbackFunction) {
      ConnectionPool.singleton.pool.getConnection((connErr, conn) => {
         if (connErr) {
            response.status(http.INTERNAL_SERVER_ERROR).json('Failed to establish database connection' + connErr);
         } else {
            logger.info('Connection acquired');
            conn.query(query, (queryErr, results, fields) => {
               conn.release();
               if (queryErr) {
                  response.status(http.INTERNAL_SERVER_ERROR).json('Query failed ' + queryErr);
               }
               callback(queryErr, results, fields);
            });
         }
      });
   }

   protected pool: Pool;

   public constructor(protected config: string, protected connectionLimit: number) {
      this.config = config;
      this.connectionLimit = connectionLimit;
      this.pool = mysql.createPool(this.config);
   }
}
