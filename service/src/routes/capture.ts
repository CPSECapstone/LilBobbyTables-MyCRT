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
                  const query = mysql.format("SELECT * FROM Capture", []);
                  conn.query(query, (queryErr, rows) => {
                     response.json(rows);
                     conn.end();
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
                  const query = mysql.format("SELECT * FROM Capture WHERE id = ?", [id]);
                  conn.query(query, (queryErr, rows) => {
                     response.json(rows);
                     conn.end();
                  });
               }
            });
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
                  const insert = mysql.format("INSERT INTO Capture SET ?", capture);
                  const query = conn.query(insert, (queryErr, result) => {
                     if (queryErr) {
                        throw queryErr;
                     } else {
                        /* TODO get the aws credentials from the environment */
                        /*    aws.config(...)  */
                        /* TODO get the parameterGroup from the environment */
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
                        logger.info("About to send the aws request");
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
