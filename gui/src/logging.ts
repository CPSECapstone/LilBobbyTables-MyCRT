
import { MessageLogger } from '@lbt-mycrt/cli/dist/mycrt-client/client-delegate';

const consoleInfo: MessageLogger = (msg: string): void => {
   // tslint:disable-next-line:no-console
   console.info(msg);
};

const consoleWarn: MessageLogger = (msg: string): void => {
   // tslint:disable-next-line:no-console
   console.warn(msg);
};

const consoleError: MessageLogger = (msg: string): void => {
   // tslint:disable-next-line:no-console
   console.error(msg);
};

export const BrowserLogger = {
   debug: consoleInfo,
   error: consoleError,
   info: consoleInfo,
   silly: consoleInfo,
   warn: consoleWarn,
};
