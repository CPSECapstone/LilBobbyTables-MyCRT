import { launch } from '@lbt-mycrt/capture';
import { Logging } from '@lbt-mycrt/common';
import * as http from 'http-status-codes';
import mysql = require('mysql');
import SelfAwareRouter from './self-aware-router';

export default class CaptureRouter extends SelfAwareRouter {
   public name: string = 'capture';
   public urlPrefix: string = '/capture';

   protected mountRoutes(): void {
      const logger = Logging.getLogger();
      const config = require('../../db/config.json');
      const conn = mysql.createConnection(config);

      this.router
         .get('/', (request, response) => {
            conn.connect((err) => {
               if (err) {
                  throw err;
               } else {
                  const query = mysql.format("SELECT * FROM Capture", []);
                  conn.query(query, (rows) => {
                     response.json(rows);
                     conn.end();
                  });
               }
            });
         })

         .get('/:id', (request, response) => {
            const id = request.params.id;
            conn.connect((err) => {
               if (err) {
                  throw err;
               } else {
                  const query = mysql.format("SELECT * FROM Capture WHERE id = ?", [id]);
                  conn.query(query, (rows) => {
                     response.json(rows);
                     conn.end();
                  });
               }
            });
         })

         .post('/', (request, response) => {
            /* Add error checking for insert */
            const capture = request.body;
            conn.connect((connErr) => {
               if (connErr) {
                  throw connErr;
               } else {
                  const insert = mysql.format("INSERT INTO Capture SET ?", capture);
                  const query = conn.query(insert, (queryErr, result) => {
                     if (queryErr) {
                        throw queryErr;
                     } else {
                        response.json(result.insertId);
                     }
                  });
               }
            });
         })
      ;
   }
}
