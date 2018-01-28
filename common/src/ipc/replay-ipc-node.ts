import winston = require('winston');

import { ChildIpcNode } from './child-ipc-node';
import { IReplayIpcNodeDelegate } from './delegates/replay-delegate';
import { ReplayStopMessage } from './messages/replay-messages';

export class ReplayIpcNode extends ChildIpcNode {

   constructor(id: number, logger: winston.LoggerInstance, protected delegate: IReplayIpcNodeDelegate) {
      super(`replay${id}`, logger);
      this.setHandlers();

   }

   protected setHandlers(): void {
      const delegate = this.delegate;
      this.handle(ReplayStopMessage, () => { // wrap this in an outer function because reasons
         return delegate.onStop();
      });
   }

}
