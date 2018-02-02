import winston = require('winston');

// import { TestMessage } from './messages/test-message';
import { IpcNode } from './ipc-node';
import { ServerIpcNodePath } from './server-ipc-node';

/**
 * An IpcNode for a Capture/Replay
 */
export class ChildIpcNode extends IpcNode {

   /** The socket reference to the mycrt service */
   protected mycrt: any;

   constructor(id: string, logger: winston.LoggerInstance) {
      super(id, logger);
      this.setReceivers();
   }

   /** starts the ipc server and connects to the mycrt IpcNode */
   public async start() {
      this.logger.info(`Connecting to ${ServerIpcNodePath}`);
      this.mycrt = await this.connectTo('mycrt', ServerIpcNodePath);
      this.logger.info(`Successfully connected to ${ServerIpcNodePath}`);

      return super.start();
   }

   /** stop the ipc server and disconnect from the mycrt IpcNode */
   public stop() {
      this.logger.info(`Disconnecting from ${ServerIpcNodePath}`);
      this.disconnect('mycrt');
      this.logger.info(`Successfully disconnected from ${ServerIpcNodePath}`);

      return super.stop();
   }

   /** register messages to receive */
   protected setReceivers(): void {
      const getMycrt = () => this.mycrt;

      // this.receive(getMycrt, TestMessage, this.receiveTest);
   }

   // public sendTestMessage() {
   //    this.sendMessage(this.mycrt, TestMessage, "THIS IS THE TEST MESSAGE");
   // }

   // private receiveTest(str: string) {
   //    this.logger.info(`Got response: ${str}`);
   // }

}
