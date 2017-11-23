import { launch } from '@lbt-mycrt/capture';
import { Logging } from '@lbt-mycrt/common';
import * as aws from 'aws-sdk';
import * as http from 'http-status-codes';
import * as mysql from 'mysql';
import SelfAwareRouter from './self-aware-router';

export default class CaptureRouter extends SelfAwareRouter {
   public name: string = 'capture';
   public urlPrefix: string = '/capture';

   protected mountRoutes(): void {
      const logger = Logging.defaultLogger(__dirname);
      const config = require('../../db/config.json');

      this.router
         .get('/', (request, response) => {
            const conn = mysql.createConnection(config);

            conn.connect((connErr) => {
               if (connErr) {
                  throw connErr;
               } else {
                  const queryStr = mysql.format("SELECT * FROM Capture", []);
                  conn.query(queryStr, (queryErr, rows) => {
                     if (queryErr) {
                        throw queryErr;
                     } else {
                        response.json(rows);
                        conn.end();
                     }
                  });
               }
            });
         })

         .get('/:id', (request, response) => {
            const id = request.params.id;
            const conn = mysql.createConnection(config);

            conn.connect((connErr) => {
               if (connErr) {
                  throw connErr;
               } else {
                  const queryStr = mysql.format("SELECT * FROM Capture WHERE id = ?", [id]);
                  conn.query(queryStr, (queryErr, rows) => {
                     if (queryErr) {
                        throw queryErr;
                     } else {
                        response.json(rows[0]);
                        conn.end();
                     }
                  });
               }
            });
         })

         .post('/:id/stop', (request, response) => {
            /* TODO get the aws credentials from the environment in MyCRT database */
            const myConn = mysql.createConnection(config);
            aws.config.update({region: 'us-east-2'});
            const rds = new aws.RDS();
            const s3 = new aws.S3();
            /* TODO get the parameterGroup from the environment in MyCRT database */
            const parameterGroup: string = "supergroup";
            const params = {
                DBParameterGroupName : parameterGroup,
                Parameters: [
                    {
                        ApplyMethod: "immediate",
                        ParameterName: "general_log",
                        ParameterValue: '0',
                    },
                ],
            };
            /* TODO send an API request to disable general log in the parameterGroup */
            rds.modifyDBParameterGroup(params, (awsErr, data) => {
               if (awsErr) {
                  throw awsErr;
               } else {
                  /* TODO connect to the database held by the environment */
                  const remoteConfig = require('../../db/remoteConfig.json');
                  const remoteConn = mysql.createConnection(remoteConfig);
                  remoteConn.connect((remoteConnErr) => {
                     if (remoteConnErr) {
                        throw remoteConnErr;
                     } else {
                        /* TODO run a query to select the general_log */
                        const queryStr = mysql.format("SELECT * FROM mysql.general_log " +
                           "where user_host = ?", ["nfl2015user[nfl2015user] @  [172.31.35.19]"]);
                        remoteConn.query(queryStr, (queryErr, rows) => {
                           if (queryErr) {
                              throw queryErr;
                           } else {
                              /* STOP REVERTING */
                              /* Get s3 bucket from environment */
                              /* TODO connect to an S3 bucket using aws credentials */
                              /* TODO intelligently name the key filename */
                              /* TODO update the MyCRT database */
                              const s3Params = {
                                 Body: JSON.stringify(rows),
                                 Bucket : "nfllogbucket",
                                 Key: "mylog.json",
                              };
                              s3.upload(s3Params, (s3Err: any, s3res: any) => {
                                 if (s3Err) {
                                    throw s3Err;
                                 } else {
                                    response.json(s3res);
                                    remoteConn.end();
                                    myConn.end();
                                 }
                              });
                           }
                        });
                     }
                  });
               }
            });
            /* TODO dump the general_log on the S3 bucket */
         })

         .post('/', (request, response) => {
            /* Add validation for insert */
            const capture = request.body;
            const conn = mysql.createConnection(config);
            aws.config.update({region: 'us-east-2'});
            const rds = new aws.RDS();

            conn.connect((connErr) => {
               if (connErr) {
                  throw connErr;
               } else {
                  const insertStr = mysql.format("INSERT INTO Capture SET ?", capture);
                  conn.query(insertStr, (queryErr, result) => {
                     if (queryErr) {
                        throw queryErr;
                     } else {
                        /* TODO get the aws credentials from the environment in MyCRT database*/
                        /*    aws.config(...)  */
                        /* TODO get the parameterGroup from the environment in MyCRT database*/
                        const parameterGroup: string = "supergroup";
                        const params = {
                           DBParameterGroupName : parameterGroup,
                           Parameters: [
                              {
                                 ApplyMethod: "immediate",
                                 ParameterName: "general_log",
                                 ParameterValue: '1',
                              },
                           ],
                        };
                        rds.modifyDBParameterGroup(params, (awsErr, data) => {
                           if (awsErr) {
                              throw awsErr;
                           } else {
                              response.json(result.insertId);
                              conn.end();
                           }
                        });
                     }
                  });
               }
            });
         })
      ;
   }
}
