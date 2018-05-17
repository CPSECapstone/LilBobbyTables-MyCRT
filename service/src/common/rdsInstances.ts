import { RDS } from 'aws-sdk';
import * as http from 'http-status-codes';

import { IDbReference } from '@lbt-mycrt/common';
import { HttpError } from '../http-error';

const getDBInstancesFromAws = (rds: RDS, params: any): Promise<any> => {
   return new Promise((resolve, reject) => {
      rds.describeDBInstances(params, (err, data) => {
         if (err) {
            reject(err);
         } else {
            resolve(data);
         }
      });
   });
};

export const getDbInstances = async (rds: RDS, params: any): Promise<IDbReference[]> => {
   try {
      const data = await getDBInstancesFromAws(rds, params);
      return data.DBInstances.map((dbInstance: RDS.DBInstance): IDbReference => ({
         instance: dbInstance.DBInstanceIdentifier,
         name: dbInstance.DBName || dbInstance.DBInstanceIdentifier,
         user: dbInstance.MasterUsername,
         host: dbInstance.Endpoint ? dbInstance.Endpoint.Address : "",
         parameterGroup: dbInstance.DBParameterGroups ?
            dbInstance.DBParameterGroups[0].DBParameterGroupName : "",
      }));
   } catch (e) {
      throw new HttpError(http.BAD_REQUEST, "Credentials are invalid");
   }
};
