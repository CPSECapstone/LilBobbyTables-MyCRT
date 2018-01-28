import { IIpcMessage } from './ipc-message';

export const ReplayStopMessage = {
   name: 'replay.stop',

   createMessage: (): null => {
      return null;
   },

} as IIpcMessage<null, any>;
