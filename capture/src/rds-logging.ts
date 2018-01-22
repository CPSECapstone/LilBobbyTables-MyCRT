import aws = require('aws-sdk');
import mysql = require('mysql');

// tslint:disable-next-line:no-var-requires
const remoteConfig = require('../db/remoteConfig.json');

aws.config.update({region: 'us-east-2'});
const rds = new aws.RDS();
const s3 = new aws.S3();

/** Turn general logging on/off in RDS */
const setGeneralLogging = async (on: boolean) => {

   /* TODO get the aws credentials from the environment in MyCRT database*/
   /*    aws.config(...)  */
   /* TODO get the parameterGroup from the environment in MyCRT database*/

   const parameterGroup: string = "supergroup";
   const params = {
      DBParameterGroupName: parameterGroup,
      Parameters: [
         {
            ApplyMethod: "immediate",
            ParameterName: "general_log",
            ParameterValue: on ? '1' : '0',
         },
      ],
   };

   return new Promise<void>((resolve, reject) => {
      rds.modifyDBParameterGroup(params, (awsErr, data) => {
         if (awsErr) {
            reject(awsErr);
         } else {
            resolve();
         }
      });
   });
};

const uploadToS3 = async (body: string) => {
   /* Get s3 bucket from environment */
   /* TODO connect to an S3 bucket using aws credentials */
   /* TODO intelligently name the key filename */
   /* TODO update the MyCRT database */
   const s3Params = {
      Body: body,
      Bucket: "nfllogbucket",
      Key: "mylog.json",
   };

   return new Promise<any>((resolve, reject) => {
      s3.upload(s3Params, (s3Err: any, s3res: any) => {
         if (s3Err) {
            reject(s3Err);
         } else {
            resolve(s3res);
         }
      });
   });
};

export const startRdsLogging = async () => {
   return await setGeneralLogging(true);
};

// TODO: clean up some more of the callback hell
export const stopRdsLoggingAndUploadToS3 = async (): Promise<any> => {

   await setGeneralLogging(false);

   return new Promise<any>((resolve, reject) => {
      /* TODO connect to the database held by the environment */
      const remoteConn = mysql.createConnection(remoteConfig);
      remoteConn.connect((remoteConnErr) => {
         if (remoteConnErr) {
            reject(remoteConnErr);
         } else {
            /* TODO run a query to select the general_log */
            const queryStr = mysql.format("SELECT * FROM mysql.general_log " +
            "where user_host = ?", ["nfl2015user[nfl2015user] @  [172.31.35.19]"]);

            remoteConn.query(queryStr, async (queryErr, rows) => {
               remoteConn.end();
               if (queryErr) {
                  reject(queryErr);
               } else {
                  const s3res = await uploadToS3(JSON.stringify(rows));
                  resolve(s3res);
               }
            });

         }
      });
   });
};
