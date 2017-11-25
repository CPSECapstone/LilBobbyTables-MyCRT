import { MyCrtClient } from '@lbt-mycrt/cli/dist/mycrt-client/client';

import { BrowserLogger } from '../../logging';

const delegate = {

   fetch: (input: RequestInfo, init?: RequestInit) => {
      return window.fetch(input, init);
   },

   logger: BrowserLogger,

   onError: (reason: any): void => {
      const msg = `An error occurred while making a request to the MyCRT service: ${JSON.stringify(reason)}`;
      BrowserLogger.error(msg);
   },

};

export const mycrt = new MyCrtClient('localhost:3000', delegate);
