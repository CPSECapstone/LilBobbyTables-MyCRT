import mysql = require('mysql');

import { ChildProgramType, ICommand, mycrtDbConfig } from '@lbt-mycrt/common';
import { StorageBackend } from '@lbt-mycrt/common/dist/storage/backend';

import { WorkloadLogger } from './workload-logger';

const connect = (): Promise<mysql.Connection> => {
   const conn = mysql.createConnection(mycrtDbConfig);
   return new Promise<mysql.Connection>((resolve, reject) => conn.connect((err) => err ? reject(err) : resolve(conn)));
};

const query = <T>(conn: mysql.Connection, qStr: string): Promise<T> => {
   return new Promise<T>((resolve, reject) => conn.query(qStr, (err, rows) => err ? reject(err) : resolve(rows)));
};

export class LocalWorkloadLogger extends WorkloadLogger {

   private static readonly GENERAL_LOG_QUERY_TEMPLATE: string =
      'SELECT event_time, user_host, thread_id, server_id, command_type, convert(argument using utf8) as argument '
      + 'FROM mysql.general_log WHERE event_time BETWEEN ? AND ?';

   constructor(type: ChildProgramType, id: number, storage: StorageBackend) {
      super(type, id, storage);
   }

   protected async queryGeneralLog(start: Date, end: Date): Promise<ICommand[]> {
      const conn = await connect();
      const qStr = this.generalLogQueryStr(start, end);
      const result = await query<ICommand[]>(conn, qStr);
      conn.end();
      return result;
   }

   protected async turnOnLogging(): Promise<void> {
      const conn = await connect();
      await query(conn, 'SET GLOBAL log_output = \'TABLE\'');
      await query(conn, 'SET GLOBAL general_log = \'ON\'');
      conn.end();
   }

   protected async turnOffLogging(): Promise<void> {
      const conn = await connect();
      await query(conn, 'SET GLOBAL general_log = \'OFF\'');
      await query(conn, 'SET GLOBAL log_output = \'NONE\'');
      conn.end();
   }

   private generalLogQueryStr(start: Date, end: Date): string {
      return mysql.format(LocalWorkloadLogger.GENERAL_LOG_QUERY_TEMPLATE, [start, end]);
   }

}

export const fakeRequest = async (): Promise<void> => {
   const conn = await connect();
   await query(conn, 'UPDATE LilBobbyTables SET time=NOW();');
   conn.end();
};
