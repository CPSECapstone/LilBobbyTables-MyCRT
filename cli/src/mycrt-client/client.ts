import * as http from 'http-status-codes';

import { IChildProgram, IMetricsList, MetricType } from '@lbt-mycrt/common/dist/data';

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
   public async postCapture(capture: IChildProgram): Promise<number | null> {
      return this.makeRequest<number>(HttpMethod.POST, '/captures', null, capture);
   }

   /** Stop a specific capture */
   public async stopCapture(id: number): Promise<any> {
      return this.makeRequest<IChildProgram>(HttpMethod.POST, `/captures/${id}/stop`);
   }

   /** Retrieve all of the captures */
   public async getCaptures(): Promise<IChildProgram[] | null> {
      return this.makeRequest<IChildProgram[]>(HttpMethod.GET, '/captures');
   }

   /** Retrieve a specific capture */
   public async getCapture(id: number): Promise<IChildProgram | null> {
      return this.makeRequest<IChildProgram>(HttpMethod.GET, `/captures/${id}`);
   }

   /** Retrieve a set of specific metrics for a Capture. */
   public async getCaptureMetrics(id: number, type: MetricType): Promise<IMetricsList | null> {
      return this.makeRequest<IMetricsList>(HttpMethod.GET, `/captures/${id}/metrics`, {type: type.toString()});
   }

   /** Retrieve all of the metrics for a Capture */
   public async getAllCaptureMetrics(id: number): Promise<[IMetricsList] | null> {
      return this.makeRequest<[IMetricsList]>(HttpMethod.GET, `/captures/${id}/metrics`);
   }

   /** Create a new Replay */

   /** Retrieve all of the replays */
   public async getReplays(): Promise<IChildProgram[] | null> {
      return this.makeRequest<IChildProgram[]>(HttpMethod.GET, '/replays');
   }

   /** Retrieve a specific replay */
   public async getReplay(id: number): Promise<IChildProgram | null> {
      return this.makeRequest<IChildProgram>(HttpMethod.GET, `/replays/${id}`);
   }

   private async makeRequest<T>(method: HttpMethod, url: string, params?: any, body?: any): Promise<T | null> {

      const fullUrl: URL = new URL(`${this.host}/api${url}`);
      if (params !== undefined) {
         Object.keys(params).forEach((key) => { fullUrl.searchParams.append(key, params[key]); });
      }

      this.delegate.logger.info(`Performing ${method} on ${fullUrl}`);

      const options = {
         body: JSON.stringify(body) || undefined,
         headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
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
