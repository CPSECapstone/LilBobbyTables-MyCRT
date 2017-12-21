import { IIpcMessage } from './ipc-message';

export const CaptureStopMessage = {
   name: "capture.stop",

   createMessage: (): null => {
      return null;
   },
} as IIpcMessage<null, any>;
