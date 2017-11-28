import { IIpcMessage } from './ipc-message';

/**
 * An example Mesasge for IpcNode communication.
 *
 * Check the ServerIpcNode for an example of how to receive for this message.
 * Check the ChildIpcNode for an example of how to send this message.
 */
export const TestMessage = {
   name: "cameron.test",

   createMessage: (): string => {
      return "this is the test message";
   },

} as IIpcMessage<string, string>;
