import winston = require('winston');

import { ChildIpcNode } from './child-ipc-node';
import { ICaptureIpcNodeDelegate } from './delegates/capture-delegate';
import { CaptureStopMessage } from './messages/capture-messages';

export class CaptureIpcNode extends ChildIpcNode {

   constructor(id: number, logger: winston.LoggerInstance, protected delegate: ICaptureIpcNodeDelegate) {
      super(`capture${id}`, logger);
      this.setHandlers();
   }

   protected setHandlers(): void {
      const delegate = this.delegate;
      this.handle(CaptureStopMessage, () => { // wrap this in an outer function because reasons
         return delegate.onStop();
      });
   }

}
