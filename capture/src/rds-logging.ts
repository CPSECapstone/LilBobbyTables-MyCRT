import { RDS, S3 } from 'aws-sdk';
import mysql = require('mysql');

import { IEnvironmentFull, Logging } from '@lbt-mycrt/common';
import { StorageBackend } from '@lbt-mycrt/common/dist/storage/backend';
import { Capture } from './capture';

const logger = Logging.defaultLogger(__dirname);

/** Turn general logging on/off in RDS */
const setGeneralLogging = async (on: boolean, capture: Capture) => {
   /* TODO get the aws credentials from the environment in MyCRT database*/
   const params = {
      DBParameterGroupName: capture.env.parameterGroup,
      Parameters: [
         {
            ApplyMethod: "immediate",
            ParameterName: "general_log",
            ParameterValue: on ? '1' : '0',
         },
      ],
   };

   // TODO: needs to be replaced by a DatabaseBackend object in the Capture Object
   const rds = new RDS(
      {region: capture.env.region, accessKeyId: capture.env.accessKey, secretAccessKey: capture.env.secretKey},
   );
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

const uploadToS3 = async (body: string, capture: Capture) => {
   /* TODO intelligently name the key filename */
   const s3Params = {
      Body: body,
      Bucket: capture.env.bucket,
      Key: "mylog.json",
   };

   // TODO: needs to be replaced by a S3StorageBackend object in the Capture Object
   const s3 = new S3(
      {region: capture.env.region, accessKeyId: capture.env.accessKey, secretAccessKey: capture.env.secretKey},
   );

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

export const startRdsLogging = async (capture: Capture) => {
   return await setGeneralLogging(true, capture);
};

export const stopRdsLoggingAndUploadToS3 = async (capture: Capture): Promise<any> => {
   logger.info("Turning off general logging, querying general logs, and putting them on S3");

   await setGeneralLogging(false, capture);

   return new Promise<any>((resolve, reject) => {
      const remoteConn = mysql.createConnection({
         database: capture.env.dbName,
         host: capture.env.host,
         password: capture.env.pass,
         user: capture.env.user,
      });

      remoteConn.connect((remoteConnErr) => {
         if (remoteConnErr) {
            reject(remoteConnErr);
         } else {
            const queryStr = mysql.format("SELECT * FROM mysql.general_log " +
            "where user_host = ?", ["nfl2015user[nfl2015user] @  [172.31.35.19]"]);

            remoteConn.query(queryStr, async (queryErr, rows) => {
               remoteConn.end();
               if (queryErr) {
                  reject(queryErr);
               } else {
                  logger.info("Uploading workload to s3");
                  const s3res = await uploadToS3(JSON.stringify(rows), capture);
                  logger.info(`Workload located at ${s3res}`);
                  resolve(s3res);
               }
            });
         }
      });
   });
};
