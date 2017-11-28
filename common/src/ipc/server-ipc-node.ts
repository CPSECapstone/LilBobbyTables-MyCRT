import winston = require('winston');

import { IpcNode, IpcNodeAppspace, IpcNodeSocketRoot } from './ipc-node';
// import { TestMessage } from './test-message';

export const ServerIpcNodeId: string = 'server.ipcnode';
export const ServerIpcNodePath: string = `${IpcNodeSocketRoot}${IpcNodeAppspace}${ServerIpcNodeId}`;

/**
 * An IpcNode for the MyCRT Service.
 */
export class ServerIpcNode extends IpcNode {

   /** all of the IpcNodes for the Capture programs */
   private captures: { [id: string]: any } = {};

   /** all of the IpcNodes for the Replay programs */
   private replays: { [id: string]: any } = {};

   constructor(logger: winston.LoggerInstance) {
      super(ServerIpcNodeId, logger);
      this.setHandlers();
   }

   /** register messages to handle */
   private setHandlers(): void {
      // this.handle(TestMessage, this.handleTestMessage);
   }

   // private async handleTestMessage(input: string): Promise<string> {
   //    return 'THIS IS THE OUTPUT';
   // }

}
