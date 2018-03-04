import { RDS } from 'aws-sdk';
import mysql = require('mysql');

import { ChildProgramType, ICommand, IEnvironment, IEnvironmentFull } from '@lbt-mycrt/common';
import { StorageBackend } from '@lbt-mycrt/common/dist/storage/backend';

import { WorkloadLogger } from './workload-logger';

export class AwsWorkloadLogger extends WorkloadLogger {

   constructor(type: ChildProgramType, id: number, protected rds: RDS, storage: StorageBackend,
      protected env: IEnvironmentFull) {
      super(type, id, storage);
      this.env = env;
   }

   protected async queryGeneralLog(start: Date, end: Date): Promise<ICommand[]> {
      const conn = await this.connect();
      const result = await this.doGeneralLogQuery(conn, start, end);
      return result;
   }

   protected turnOnLogging(): Promise<void> {
      const params = this.getParameterGroup(true);
      return this.modifyParameterGroup(params);
   }

   protected turnOffLogging(): Promise<void> {
      const params = this.getParameterGroup(false);
      return this.modifyParameterGroup(params);
   }

   private connect(): Promise<mysql.Connection> {
      const conn: mysql.Connection = mysql.createConnection({database: this.env.dbName, host: this.env.host,
         password: this.env.pass, user: this.env.user});
      return new Promise<mysql.Connection>((resolve, reject) => conn.connect((connErr) => connErr ? reject(connErr)
         : resolve(conn)));
   }

   private doGeneralLogQuery(conn: mysql.Connection, start: Date, end: Date): Promise<ICommand[]> {
      // TODO: make sure we are only querying for user activity
      const query = mysql.format('SELECT * FROM mysql.general_log where user_host = ? AND event_time BETWEEN ? AND ?',
         ["nfl2015user[nfl2015user] @  [172.31.35.19]", start, end]);
      return new Promise<ICommand[]>((resolve, reject) => {
         conn.query(query, (queryErr, rows) => {
            conn.end();
            queryErr ? reject(queryErr) : resolve(rows as ICommand[]);
         });
      });
   }

   private getParameterGroup(on: boolean): RDS.Types.ModifyDBParameterGroupMessage {
      return {
         DBParameterGroupName: this.env.parameterGroup,
         Parameters: [
            {
               ApplyMethod: 'immediate',
               ParameterName: 'general_log',
               ParameterValue: on ? '1' : '0',
            },
         ],
      };
   }

   private modifyParameterGroup(params: RDS.Types.ModifyDBParameterGroupMessage): Promise<void> {
      return new Promise<void>((resolve, reject) => {
         this.rds.modifyDBParameterGroup(params, (err, data) => err ? reject(err) : resolve());
      });
   }

}
