import { WebClient } from '@slack/client';

import { defaultLogger } from '../logging';

const logger = defaultLogger(__dirname);

const token = 'xoxb-247260616021-366844424759-CYOcDuGEnqiHdUkhCRTh0TGp';

const channelId = 'C7A678PRV';

const web = new WebClient(token);

export class SlackBot {
   public static async postMessage(message: string): Promise<any> {
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
}
