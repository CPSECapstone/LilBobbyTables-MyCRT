import mysql = require('mysql');

import { ChildProgramType, mycrtDbConfig } from '@lbt-mycrt/common';
import { StorageBackend } from '@lbt-mycrt/common/dist/storage/backend';

import { WorkloadLogger } from './workload-logger';

const generalLogQueryStr: string = 'SELECT event_time, user_host, thread_id, server_id, command_type, ' +
   'convert(argument using utf8) as argument FROM mysql.general_log';

export class LocalWorkloadLogger extends WorkloadLogger {

   constructor(type: ChildProgramType, id: number, storage: StorageBackend) {
      super(type, id, storage);
   }

   protected turnOnLogging(): Promise<void> {
      const conn = mysql.createConnection(mycrtDbConfig);

      return new Promise<void>((resolve, reject) => {
         conn.connect((connErr) => {
            if (connErr) {
               reject(connErr);
            } else {
               conn.query('SET GLOBAL log_output = \'TABLE\'', (queryErr0) => {
                  if (queryErr0) {
                     conn.end();
                     reject(queryErr0);
                  } else {
                     conn.query('SET GLOBAL general_log = \'ON\'', (queryErr1) => {
                        conn.end();
                        queryErr1 ? reject(queryErr1) : resolve();
                     });
                  }
               });
            }
         });
      });
   }

   protected turnOffLogging(): Promise<void> {
      const conn = mysql.createConnection(mycrtDbConfig);

      return new Promise<void>((resolve, reject) => {
         conn.connect((connErr) => {
            if (connErr) {
               reject(connErr);
            } else {
               conn.query('SET GLOBAL general_log = \'OFF\'', (queryErr0) => {
                  if (queryErr0) {
                     conn.end();
                     reject(queryErr0);
                  } else {
                     conn.query('SET GLOBAL log_output = \'NONE\'', (queryErr1) => {
                        conn.end();
                        queryErr1 ? reject(queryErr1) : resolve();
                     });
                  }
               });
            }
         });
      });
   }

   protected queryGeneralLog(): Promise<any[]> {
      const conn = mysql.createConnection(mycrtDbConfig);

      return new Promise<any[]>((resolve, reject) => {
         conn.connect((connErr) => {
            if (connErr) {
               reject(connErr);
            } else {
               conn.query(generalLogQueryStr, (queryErr, rows) => {
                  if (queryErr) {
                     conn.end();
                     reject(queryErr);
                  } else {
                     conn.query('TRUNCATE table mysql.general_log', (queryErr1) => {
                        conn.end();
                        queryErr1 ? reject(queryErr1) : resolve(rows);
                     });
                  }
               });
            }
         });
      });
   }

}

export const fakeRequest = (): Promise<void> => {
   const conn = mysql.createConnection(mycrtDbConfig);

   return new Promise<void>((resolve, reject) => {

      conn.connect((connErr) => {
         if (connErr) {
            reject(connErr);
         } else {
            conn.query('UPDATE LilBobbyTables SET time=NOW();', (queryErr) => {
               conn.end();
               queryErr ? reject(queryErr) : resolve();
            });
         }
      });
   });
};