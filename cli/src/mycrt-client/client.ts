import * as http from 'http-status-codes';
import { IRestResponse, RestClient } from 'typed-rest-client/RestClient';

import { ICapture, IReplay, Logging } from '@lbt-mycrt/common';
import { IRequestOptions } from 'typed-rest-client/Interfaces';

const logger = Logging.defaultLogger(__dirname);

enum HttpMethod { GET = 'GET', POST = 'POST', PUT = 'PUT', DELETE = 'DELETE' }

export default class MyCrtClient {

   // TODO: handle the production case
   public static host: string = process.env.NODE_ENV === 'prod' ? '' : 'http://localhost:3000';

   private mycrt: RestClient;

   constructor() {
      this.mycrt = new RestClient('rest-samples', `${MyCrtClient.host}/api`);
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

      let response: IRestResponse<T>;
      let delResponse: IRestResponse<{}>;
      let deleting: boolean = false;

      switch (method) {

         case HttpMethod.DELETE:
            deleting = true;
            delResponse = await this.mycrt.del(url);
            break;

         case HttpMethod.GET:
            response = await this.mycrt.get<T>(url);
            break;

         case HttpMethod.POST:
         case HttpMethod.PUT:
            if (!body) {
               logger.error(`No body provided for ${method} to ${url}`);
               return null;
            }
            if (method === HttpMethod.POST) {
               response = await this.mycrt.create<T>(url, body);
            } else {
               response = await this.mycrt.update<T>(url, body);
            }
            break;

      }

      const status = deleting ? delResponse!.statusCode : response!.statusCode;

      if (status !== http.OK) {
         logger.warn(`${method} to ${url} has response status ${status}`);
         return null;

      } else if (deleting) {
         return null;

      }  else {
         return response!.result;
      }

   }

}
