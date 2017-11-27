import * as http from 'http-status-codes';

import { ICapture, IReplay } from '@lbt-mycrt/common/dist/data';

import { IMyCrtClientDelegate } from './client-delegate';

export enum HttpMethod { GET = 'GET', POST = 'POST', PUT = 'PUT', DELETE = 'DELETE' }

/** General Client class for accessing the MyCRT service */
export class MyCrtClient {

   private readonly host: string;

   /**
    * Using a delegate allows the client to work in both the Node runtime (cli) and in browsers (gui).
    * This is because the Node runtime should use the file system (not available in the browser),
    * and, the browser has a native 'fetch' function that we want to use. Providing a delegate
    * allows the user of MyCrtClient to define these behaviors specific to their runtime environments.
    */
   private delegate: IMyCrtClientDelegate;

   constructor(host: string, delegate: IMyCrtClientDelegate) {
      this.host = `http://${host}`;
      this.delegate = delegate;
   }

   /** Create a new Capture */
   public async postCapture(capture: ICapture): Promise<number | null> {
      return this.makeRequest<number>(HttpMethod.POST, '/capture', capture);
   }

   /** Stop a specific capture */
   public async stopCapture(id: number): Promise<any> {
      return this.makeRequest<ICapture>(HttpMethod.POST, `/capture/${id}/stop`);
   }

   /** Retrieve all of the captures */
   public async getCaptures(): Promise<ICapture[] | null> {
      return this.makeRequest<ICapture[]>(HttpMethod.GET, '/capture');
   }

   /** Retrieve a specific capture */
   public async getCapture(id: number): Promise<ICapture | null> {
      return this.makeRequest<ICapture>(HttpMethod.GET, `/capture/${id}`);
   }

   /** Retrieve all of the replays */
   public async getReplays(): Promise<IReplay[] | null> {
      return this.makeRequest<IReplay[]>(HttpMethod.GET, '/replay');
   }

   /** Retrieve a specific replay */
   public async getReplay(id: number): Promise<IReplay | null> {
      return this.makeRequest<IReplay>(HttpMethod.GET, `/replay/${id}`);
   }

   private async makeRequest<T>(method: HttpMethod, url: string, body?: any): Promise<T | null> {

      const fullUrl = `${this.host}/api${url}`;
      this.delegate.logger.info(`Performing ${method} on ${fullUrl}`);

      const options = {
         body: body || undefined,
         method,
      };

      const response = await this.delegate.fetch(fullUrl, options).catch(this.delegate.onError);

      if (response) {
         this.delegate.logger.info(`MyCRT responded with status ${response.status}`);
         if (response.ok) {
            const json = await response.json();
            if (json) {
               return json as T;
            }
         }
      }

      return null;

   }

}
