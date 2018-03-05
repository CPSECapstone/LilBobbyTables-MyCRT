import { RDS } from 'aws-sdk';
import * as moment from 'moment';
import mysql = require('mysql');

import { ChildProgramType, ICommand, IEnvironment, IEnvironmentFull, Logging } from '@lbt-mycrt/common';
import { StorageBackend } from '@lbt-mycrt/common/dist/storage/backend';

import { WorkloadLogger } from './workload-logger';

const logger = Logging.defaultLogger(__dirname);

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
      const startDate = moment(start).add(8, 'hours').toDate();
      const endDate = moment(end).add(8, 'hours').toDate();
      const query = mysql.format("SELECT * FROM mysql.general_log " +
         "WHERE user_host NOT LIKE 'rdsadmin%' AND user_host NOT LIKE '[rdsadmin]%' AND command_type = 'Query' " +
         "AND event_time BETWEEN ? and ?", [startDate, endDate]);

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
