import { WebClient } from '@slack/client';
import * as mysql from 'mysql';

import { mycrtDbConfig } from '../dao/config';
import { defaultLogger } from '../logging';

const logger = defaultLogger(__dirname);

const token = 'xoxb-247260616021-366844424759-CYOcDuGEnqiHdUkhCRTh0TGp';

const channelId = 'C7A678PRV';

const web = new WebClient(token);

export class SlackBot {
   public static async postMessage(message: string, envId: number): Promise<any> {
      const shit = await this.getSlackConfig(envId);

      web.chat.postMessage({
         channel: channelId,
         text: message,
      })
      .then((res) => {
         logger.info("Message sent to slack!");
      })
      .catch(() => {
         logger.error("Message failed to send to slack");
      });
   }

   private static async getSlackConfig(envId: number): Promise<any> {
      const query = 'SELECT token, channel FROM Slackbot WHERE id = ?';
      const conn = await mysql.createConnection(mycrtDbConfig);
      return new Promise((resolve, reject) => {
         conn.connect((connErr, myConn) => {
            if (connErr) {
               logger.error(`Error getting connection: ${connErr}`);
               reject(connErr);
            } else {
               myConn.query(query, (queryErr: any, results: any, fields: any) => {
                  myConn.close();
                  if (queryErr) {
                     logger.error(`Error making query: ${queryErr}`);
                     reject(queryErr);
                  } else {
                     resolve(results);
                  }
               });
            }
         });
      });
   }
}
