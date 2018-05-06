import { MyCrtClient } from '@lbt-mycrt/cli/dist/mycrt-client/client';

import { showAlert } from '../../actions';
import { BrowserLogger } from '../../logging';
import { store } from '../../store';

const delegate = {

   fetch: (input: RequestInfo, init?: RequestInit) => {
      return window.fetch(input, init);
   },

   logger: BrowserLogger,

   onError: (reason: any): void => {
      const msg = `An error occurred while making a request to the MyCRT service: ${JSON.stringify(reason)}`;
      store.dispatch(showAlert({
         show: true,
         header: "A Communication Error Occurred",
         message: JSON.stringify(reason),
      }));
      BrowserLogger.error(msg);
   },

};

export const mycrt = new MyCrtClient(window.location.origin, delegate);
