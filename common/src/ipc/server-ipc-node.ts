import winston = require('winston');

import { IpcNode, IpcNodeAppspace, IpcNodeSocketRoot } from './ipc-node';

export const ServerIpcNodeId: string = 'server.ipcnode';
export const ServerIpcNodePath: string = `${IpcNodeSocketRoot}${IpcNodeAppspace}${ServerIpcNodeId}`;

export class ServerIpcNode extends IpcNode {

   private captures: { [id: string]: any } = {};
   private replays: { [id: string]: any } = {};

   constructor(logger: winston.LoggerInstance) {
      super(ServerIpcNodeId, logger);
   }

}
