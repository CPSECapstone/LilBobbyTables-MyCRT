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
      const slackConfig = await this.getSlackConfig(envId);
      logger.debug(JSON.stringify(slackConfig));
      if (slackConfig.length !== 0 && slackConfig[0].isOn) {
         web.chat.postMessage({
            channel: slackConfig[0].channel,
            text: message,
         })
         .then((res) => {
            logger.info("Message sent to slack!");
         })
         .catch(() => {
            logger.error("Message failed to send to slack");
         });
      }
   }

   private static async getSlackConfig(envId: number): Promise<any> {
      const query = mysql.format('SELECT token, channel, isOn FROM SlackConfig WHERE environmentId = ?', [envId]);
      const conn = await mysql.createConnection(mycrtDbConfig);
      return new Promise((resolve, reject) => {
         conn.connect((connErr, myConn) => {
            if (connErr) {
               logger.error(`Error getting connection: ${connErr}`);
               reject(connErr);
            } else {
               conn.query(query, (queryErr: any, results: any, fields: any) => {
                  conn.destroy();
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
