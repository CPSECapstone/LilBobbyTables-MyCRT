import * as http from 'http-status-codes';
import { IRestResponse, RestClient } from 'typed-rest-client/RestClient';

import { ICapture, IReplay, Logging } from '@lbt-mycrt/common';
import { IRequestOptions } from 'typed-rest-client/Interfaces';

const logger = Logging.defaultLogger(__dirname);

export enum HttpMethod { GET = 'GET', POST = 'POST', PUT = 'PUT', DELETE = 'DELETE' }

/** General Client class for accessing the MyCRT service */
export class MyCrtClient {

   // TODO: handle the production case
   public static host: string = process.env.NODE_ENV === 'prod' ? '' : 'http://localhost:3000';

   private mycrt: RestClient;

   constructor() {

      this.mycrt = new RestClient('rest-samples', `${MyCrtClient.host}`);

   }

   /** Create a new Capture */
   public async postCapture(capture: ICapture): Promise<ICapture | null> {
      return this.makeRequest<ICapture>(HttpMethod.POST, '/capture', capture);
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

   // TODO: support IRequestOptions
   private async makeRequest<T>(method: HttpMethod, url: string, body?: any): Promise<T | null> {

      const fullUrl = `/api${url}`;

      logger.info(`Performing ${method} on ${fullUrl}`);

      let response: IRestResponse<T>;
      let delResponse: IRestResponse<{}>;
      let deleting: boolean = false;

      switch (method) {

         case HttpMethod.DELETE:
            deleting = true;
            delResponse = await this.mycrt.del(fullUrl);
            break;

         case HttpMethod.GET:
            response = await this.mycrt.get<T>(fullUrl);
            break;

         case HttpMethod.POST:
         case HttpMethod.PUT:
            if (!body) {
               logger.error(`No body provided for ${method} to ${fullUrl}`);
               return null;
            }
            if (method === HttpMethod.POST) {
               response = await this.mycrt.create<T>(fullUrl, body);
            } else {
               response = await this.mycrt.update<T>(fullUrl, body);
            }
            break;

      }

      const status = deleting ? delResponse!.statusCode : response!.statusCode;

      if (status !== http.OK) {
         logger.warn(`${method} to ${fullUrl} has response status ${status}`);
         return null;

      } else if (deleting) {
         return null;

      }  else {
         return response!.result;
      }

   }

}
