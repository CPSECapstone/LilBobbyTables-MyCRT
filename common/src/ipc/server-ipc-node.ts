import winston = require('winston');

import { ChildProgramType } from '../data';
import { IpcNode, IpcNodeAppspace, IpcNodeSocketRoot } from './ipc-node';
import { CaptureStopMessage } from './messages/capture-messages';

export const ServerIpcNodeId: string = 'server.ipcnode';
export const ServerIpcNodePath: string = `${IpcNodeSocketRoot}${IpcNodeAppspace}${ServerIpcNodeId}`;

/**
 * An IpcNode for the MyCRT Service.
 */
export class ServerIpcNode extends IpcNode {

   /** all of the IpcNodes for the Capture programs */
   protected captures: { [id: string]: any } = {};

   /** all of the IpcNodes for the Replay programs */
   protected replays: { [id: string]: any } = {};

   constructor(logger: winston.LoggerInstance) {
      super(ServerIpcNodeId, logger);
      this.setHandlers();
   }

   /** Get the path to a child's socket */
   public getChildSocketPath(type: ChildProgramType, id: number): string {
      const typeName = type === ChildProgramType.CAPTURE ? 'capture' : 'replay';
      return `${IpcNodeSocketRoot}${IpcNodeAppspace}${typeName}${id}`;
   }

   /** Send the 'stop' signal to a capture */
   public async stopCapture(id: number) {
      const path = this.getChildSocketPath(ChildProgramType.CAPTURE, id);
      const result: any = await this.connectSendDisconnect<null, any>(path, CaptureStopMessage, null)
         .catch((reason) => {
            this.logger.error(`Failed to stop capture: ${reason}`);
         });
      return result;
   }

   /** register messages to handle */
   protected setHandlers(): void {
      // this.handle(TestMessage, this.handleTestMessage);
   }

   // private async handleTestMessage(input: string): Promise<string> {
   //    return 'THIS IS THE OUTPUT';
   // }

}
