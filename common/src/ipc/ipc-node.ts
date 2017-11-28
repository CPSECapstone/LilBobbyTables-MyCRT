import nodeIpc = require('node-ipc');
import winston = require('winston');

import { IIpcMessage } from './ipc-message';

export const IpcNodeSocketRoot: string = '/tmp/';
export const IpcNodeAppspace: string = 'mycrt.';

export type IpcMessageHandler<T, U> = (data: T, socket: any) => Promise<U>;

export class IpcNode {

   protected started: boolean = false;

   protected ipc: any = new nodeIpc.IPC();

   private ipcMessages: { [name: string]: IpcMessageHandler<any, any> } = {};

   constructor(id: string, protected logger: winston.LoggerInstance) {
      this.ipc.config.id = id;
      this.ipc.config.retry = 2000;
      this.ipc.config.appspace = IpcNodeAppspace;
      this.ipc.config.socketRoot = IpcNodeSocketRoot;
   }

   public get id(): string {
      return this.ipc.config.id;
   }

   public get socket(): string {
      return `${this.ipc.config.socketRoot}${this.ipc.config.appspace}${this.id}`;
   }

   public start(): void {
      if (this.started) {
         throw new Error(`IpcNode ${this.id} is already started`);
      }
      this.logger.info(`Starting IpcNode ${this.id}...`);

      this.ipc.serve(this.applyHandlers);
      this.ipc.server.start();

      this.started = true;
      this.logger.info(`Successfully started IpcNode ${this.id}`);
   }

   public stop(): void {
      if (!this.started) {
         throw new Error(`IpcNode ${this.id} is not started`);
      }

      this.logger.info(`Stopping IpcNode ${this.id}...`);
      this.ipc.server.stop();
      this.started = false;
      this.logger.info(`Successfully stopped IpcNode ${this.id}`);
   }

   public handledMessages(): string[] {
      return Object.keys(this.ipcMessages);
   }

   public handle<T, U>(ipcMessage: string | IIpcMessage<T, U>, handler: IpcMessageHandler<T, U>): void {
      const name = typeof(ipcMessage) === 'string' ? ipcMessage : ipcMessage.name;
      this.ipcMessages[name] = handler;
   }

   public clearIpcMessageHandlers(): void {
      this.ipcMessages = {};
   }

   private applyHandlers() {
      Object.keys(this.ipcMessages).forEach(async (messageName: string) => {
         const handler = this.ipcMessages[messageName];
         this.ipc.server.on(messageName, (request: any, socket: any) => {
            handler(request /* as T */, socket).then((response: any /* as U */) => {
               this.ipc.server.emit(socket, messageName, response);
            }).catch((reason: any) => {
               this.logger.error(`Error handling message '${messageName}': ${reason}`);
            });
         });
      });
   }

}
