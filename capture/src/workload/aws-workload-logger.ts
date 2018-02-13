import { RDS } from 'aws-sdk';
import mysql = require('mysql');

import { ChildProgramType } from '@lbt-mycrt/common';
import { StorageBackend } from '@lbt-mycrt/common/dist/storage/backend';

import { WorkloadLogger } from './workload-logger';

// tslint:disable-next-line:no-var-requires
const remoteConfig = require('../../db/remoteConfig.json');

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
      const conn = mysql.createConnection(remoteConfig);

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
