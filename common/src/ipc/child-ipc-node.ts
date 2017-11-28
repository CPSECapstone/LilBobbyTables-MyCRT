import winston = require('winston');

// import { TestMessage } from '../ipc/test-message';
import { IpcNode } from './ipc-node';
import { ServerIpcNodePath } from './server-ipc-node';

/**
 * An IpcNode for a Capture/Replay
 */
export class ChildIpcNode extends IpcNode {

   /** The socket reference to the mycrt service */
   private mycrt: any;

   constructor(id: string, logger: winston.LoggerInstance) {
      super(id, logger);
      this.setReceivers();
   }

   /** starts the ipc server and connects to the mycrt IpcNode */
   public async start() {
      this.logger.info(`Connecting to ${ServerIpcNodePath}`);
      this.mycrt = await this.connectTo('mycrt', ServerIpcNodePath);
      this.logger.info(`Successfully connected to ${ServerIpcNodePath}`);

      await super.start();
   }

   /** stop the ipc server and disconnect from the mycrt IpcNode */
   public stop(): void {
      super.stop();

      this.logger.info(`Disconnecting from ${ServerIpcNodePath}`);
      // TODO
      this.logger.info(`Successfully disconnected from ${ServerIpcNodePath}`);
   }

   // public sendTestMessage() {
   //    this.sendMessage(this.mycrt, TestMessage, "THIS IS THE TEST MESSAGE");
   // }

   /** register messages to receive */
   private setReceivers(): void {
      const getMycrt = () => this.mycrt;

      // this.receive(getMycrt, TestMessage, this.receiveTest);
   }

   // private receiveTest(str: string) {
   //    this.logger.info(`Got response: ${str}`);
   // }

}
