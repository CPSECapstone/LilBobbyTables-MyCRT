import nodeIpc = require('node-ipc');
import winston = require('winston');

import { IIpcMessage } from './ipc-message';

export const IpcNodeSocketRoot: string = '/tmp/';
export const IpcNodeAppspace: string = 'mycrt.';

export type IpcMessageHandler<T, U> = (data: T, socket: any) => Promise<U>;
export type IpcMessageReceiver<U> = (data: U) => void;

/**
 * A node in the MyCRT inter-process communication network.
 * This spawns a server that listens for incoming message on a (TCP) socket.
 * Additionally, it can make requests to other nodes through their (TCP) sockets.
 */
export class IpcNode {

   /** This suffix is added to the end of each message's name to create the response message's name */
   public static readonly RESPONSE_SUFFIX = '.response';

   /** whether or not the IpcNode has started */
   protected started: boolean = false;

   /** Underlying ipc instance */
   protected ipc: any = new nodeIpc.IPC();

   /** These are the messages that this IpcNode can receive and respond to */
   private handlableIpcMessages: { [name: string]: IpcMessageHandler<any, any> } = {};

   /** These are the messages that can responded to when sent */
   private receivableIpcMessages: { [name: string]: IpcMessageReceiver<any> } = {};

   /** These are getters for socket references for handling responses */
   private receivableSocketConnections: { [name: string]: () => any } = {};

   /**
    * @param id a unique id for this IpcNode
    * @param logger the logger to use in this node
    */
   constructor(id: string, protected logger: winston.LoggerInstance) {
      this.ipc.config.id = id;
      this.ipc.config.retry = 2000;
      this.ipc.config.appspace = IpcNodeAppspace;
      this.ipc.config.socketRoot = IpcNodeSocketRoot;
   }

   /** Gets the id of the ipc.config object, also serves as the IpcNode's id */
   public get id(): string {
      return this.ipc.config.id;
   }

   /** path to this IpcNode's socket */
   public get socket(): string {
      return `${this.ipc.config.socketRoot}${this.ipc.config.appspace}${this.id}`;
   }

   /** start the server and actually start listening for messages */
   public async start() {
      return new Promise<void>((resolve) => {
         if (this.started) {
            throw new Error(`IpcNode ${this.id} is already started`);
         }
         this.logger.info(`Starting IpcNode ${this.id}...`);

         this.ipc.serve(() => {
            this.applyHandlers();
            this.applyReceivers();
            resolve();
         });
         this.ipc.server.start();

         this.started = true;
         this.logger.info(`Successfully started IpcNode ${this.id}`);
      });
   }

   /** stop the server/listening */
   public stop(): void {
      if (!this.started) {
         throw new Error(`IpcNode ${this.id} is not started`);
      }

      this.logger.info(`Stopping IpcNode ${this.id}...`);
      this.ipc.server.stop();
      this.started = false;
      this.logger.info(`Successfully stopped IpcNode ${this.id}`);
   }

   /** get an array of messages that can be handled */
   public handledMessages(): string[] {
      return Object.keys(this.handlableIpcMessages);
   }

   /** register a message to be handled */
   public handle<T, U>(ipcMessage: string | IIpcMessage<T, U>, handler: IpcMessageHandler<T, U>): void {
      const name = typeof(ipcMessage) === 'string' ? ipcMessage : ipcMessage.name;
      this.handlableIpcMessages[name] = handler;
   }

   /** clear the messages that can be handled */
   public clearHandlableIpcMessages(): void {
      this.handlableIpcMessages = {};
   }

   /** get an array of messages that can be received */
   public receivableMessages(): string[] {
      return Object.keys(this.receivableIpcMessages);
   }

   /** register a message to be received */
   public receive<T, U>(getSocketReference: () => any, ipcMessage: string | IIpcMessage<T, U>,
                        receiver: IpcMessageReceiver<U>): void {
      const name = typeof(ipcMessage) === 'string' ? ipcMessage : ipcMessage.name;
      const responseName = `${name}${IpcNode.RESPONSE_SUFFIX}`;
      this.receivableIpcMessages[responseName] = receiver;
      this.receivableSocketConnections[responseName] = getSocketReference;
   }

   /** clear the messages that can be received */
   public clearReceivers(): void {
      this.receivableIpcMessages = {};
      this.receivableSocketConnections = {};
   }

   /**
    * send a message to an IpcNode.
    * @param ipcNode the socket of the IpcNode to send the message to.
    * @param ipcMessage the message type that is being sent.
    * @param request the actual data of the message request.
    */
   public sendMessage<T, U>(ipcNode: any, ipcMessage: string | IIpcMessage<T, U>, request: T) {
      const name = typeof(ipcMessage) === 'string' ? ipcMessage : ipcMessage.name;
      // TODO: warn when no receiver
      ipcNode.emit(name, request);
   }

   /** wrapper for this.ipc.connectTo */
   protected async connectTo(nodeId: string, path: string): Promise<any | null> {
      this.logger.info(`Connecting to ${nodeId} at ${path}`);
      return new Promise<any | null>((resolve, reject) => {
         this.ipc.connectTo(nodeId, path, () => {
            resolve(this.ipc.of[nodeId]);
         });
      });
   }

   /** start listening for incoming requests */
   private applyHandlers() {
      this.logger.info(`applying handlers for IpcNode ${this.id}`);
      const messages = Object.keys(this.handlableIpcMessages || {});
      if (messages.length > 0) {
         messages.forEach(async (messageName: string) => {
            this.logger.info(`>> Setting handler for ${messageName}`);
            const handler = this.handlableIpcMessages[messageName];
            this.ipc.server.on(messageName, (request: any, socket: any) => {
               this.logger.info(`${this.id} is handling a ${messageName} message...`);
               handler(request /* as T */, socket).then((response: any /* as U */) => {
                  this.logger.info(`${this.id} is returning the response for ${messageName}`);
                  this.ipc.server.emit(socket, `${messageName}${IpcNode.RESPONSE_SUFFIX}`, response);
               }).catch((reason: any) => {
                  this.logger.error(`Error handling message '${messageName}': ${reason}`);
               });
            });
         });
      } else {
         this.logger.warn(`No handlers to apply!`);
      }
   }

   /** handle responses from sent requests */
   private applyReceivers() {
      this.logger.info(`applying receivers for sendable messages for IpcNode ${this.id}`);
      const messages = Object.keys(this.receivableIpcMessages || {});
      if (messages.length > 0) {
         messages.forEach(async (responseName: string) => {
            this.logger.info(`>> Setting handler for ${responseName}`);
            const receiver = this.receivableIpcMessages[responseName];
            const socketReference = this.receivableSocketConnections[responseName]();
            if (!socketReference) {
               this.logger.error(`${this.id} has no socket reference for ${responseName} receiver`);
            } else {
               socketReference.on(responseName, (response: any) => {
                  this.logger.info(`${this.id} received response ${responseName}`);
                  receiver.apply(this, [response]);
               });
            }
         });
      } else {
         this.logger.warn(`No receivers to apply!`);
      }
   }

}
