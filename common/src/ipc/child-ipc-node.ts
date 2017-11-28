import winston = require('winston');

import { IpcNode } from './ipc-node';
import { ServerIpcNodePath } from './server-ipc-node';

export class ChildIpcNode extends IpcNode {

   private mycrt: any;

   public start(): void {
      super.start();

      this.logger.info(`Connecting to ${ServerIpcNodePath}`);

      // TODO

      this.logger.info(`Successfully connected to ${ServerIpcNodePath}`);
   }

   public stop(): void {
      super.stop();

      this.logger.info(`Disconnecting from ${ServerIpcNodePath}`);

      // TODO

      this.logger.info(`Successfully disconnected from ${ServerIpcNodePath}`);
   }

}
