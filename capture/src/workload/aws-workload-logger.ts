import { RDS } from 'aws-sdk';
import mysql = require('mysql');

import { ChildProgramType } from '@lbt-mycrt/common';
import { StorageBackend } from '@lbt-mycrt/common/dist/storage/backend';

import { WorkloadLogger } from './workload-logger';

export class AwsWorkloadLogger extends WorkloadLogger {

   constructor(type: ChildProgramType, id: number, protected rds: RDS, storage: StorageBackend) {
      super(type, id, storage);
   }

   protected turnOnLogging(): Promise<void> {
      const params = this.getParameterGroup(true);
      return this.modifyParameterGroup(params);
   }

   protected turnOffLogging(): Promise<void> {
      const params = this.getParameterGroup(false);
      return this.modifyParameterGroup(params);
   }

   protected async queryGeneralLog(): Promise<any[]> {
      // TODO: get this from the environment
      const conn = mysql.createConnection({
         database: "NFL",
         host: "nfl2015.c7m7t1xyrt7v.us-east-2.rds.amazonaws.com",
         password: "nfl2015pass",
         user: "nfl2015user",
      });

      return new Promise<any[]>((resolve, reject) => {
         conn.connect((connErr) => {
            if (connErr) {
               reject(connErr);
            } else {

               const query = mysql.format('SELECT * FROM mysql.general_log where user_host = ?',
                  ["nfl2015user[nfl2015user] @  [172.31.35.19]"]);

               conn.query(query, (queryErr, rows) => {
                  conn.end();
                  queryErr ? reject(queryErr) : resolve(rows);
               });
            }
         });
      });
   }

   private getParameterGroup(on: boolean): RDS.Types.ModifyDBParameterGroupMessage {
      return {
         DBParameterGroupName: 'supergroup',
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
         this.rds.modifyDBParameterGroup(params, (err, data) => {
            err ? reject(err) : resolve();
         });
      });
   }

}
