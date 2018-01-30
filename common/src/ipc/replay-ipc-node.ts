import winston = require('winston');

import { ChildIpcNode } from './child-ipc-node';
import { IReplayIpcNodeDelegate } from './delegates/replay-delegate';

export class ReplayIpcNode extends ChildIpcNode {

   constructor(id: number, logger: winston.LoggerInstance, protected delegate: IReplayIpcNodeDelegate) {
      super(`replay${id}`, logger);
      this.setHandlers();

   }

   protected setHandlers(): void {
      const delegate = this.delegate;
   }

}
