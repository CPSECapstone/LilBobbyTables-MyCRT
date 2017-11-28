import { IIpcMessage } from './ipc-message';

export const TestMessage = {
   name: "cameron.test",

   createMessage: (): string => {
      return "this is the test message";
   },

} as IIpcMessage<string, string>;
