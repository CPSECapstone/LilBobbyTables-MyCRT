import * as http from 'http-status-codes';

import { ICapture, IChildProgram, IDbReference, IEnvironment, IIamReference, IMetricsList,
   IReplay, IS3Reference, MetricType } from '@lbt-mycrt/common/dist/data';

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
   public async startCapture(capture: IChildProgram): Promise<IChildProgram | null> {
      return this.makeRequest<IChildProgram>(HttpMethod.POST, '/captures', null, capture);
   }

   /** Stop a specific capture */
   public async stopCapture(id: number): Promise<any> {
      return this.makeRequest<any>(HttpMethod.POST, `/captures/${id}/stop`);
   }

   /** Retrieve all of the captures */
   public async getCaptures(): Promise<ICapture[] | null> {
      return this.makeRequest<ICapture[]>(HttpMethod.GET, '/captures');
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

   /** Delete a specific capture */
   public async deleteCapture(id: number): Promise<void> {
      return this.makeRequest<any>(HttpMethod.DELETE, `/captures/${id}`);
   }

   /** Create a new Replay */
   public async startReplay(replay: IReplay): Promise<number | null> {
      return this.makeRequest<number>(HttpMethod.POST, '/replays', null, replay);
   }

   /** Retrieve all of the replays */
   public async getReplays(): Promise<IChildProgram[] | null> {
      return this.makeRequest<IChildProgram[]>(HttpMethod.GET, '/replays');
   }

   /** Retrieve a specific replay */
   public async getReplay(id: number): Promise<IChildProgram | null> {
      return this.makeRequest<IChildProgram>(HttpMethod.GET, `/replays/${id}`);
   }

   /** Delete a specific replay */
   public async deleteReplay(id: number): Promise<any> {
      return this.makeRequest<any>(HttpMethod.DELETE, `/replays/${id}`);
   }

   /** Create a new Environment */
   public async createEnvironment(environment: IEnvironment, iamRef: IIamReference,
      dbRef: IDbReference, s3Ref: IS3Reference): Promise<IEnvironment | null> {
      const body = {
         ...iamRef,
         ...dbRef,
         ...s3Ref,
         ...environment,
      };

      return this.makeRequest<IEnvironment | null>(HttpMethod.POST, '/environments', null, body);
   }

   /** Retrieve a specific environment */
   public async getEnvironment(id: number): Promise<IEnvironment | null> {
      return this.makeRequest<IEnvironment>(HttpMethod.GET, `/environments/${id}`);
   }

   /** Retrieve all of the environments */
   public async getEnvironments(): Promise<IEnvironment[] | null> {
      return this.makeRequest<IEnvironment[]>(HttpMethod.GET, '/environments');
   }

   /** Delete a specific environment */
   public async deleteEnvironment(id: number): Promise<void> {
      return this.makeRequest<any>(HttpMethod.DELETE, `/environments/${id}`);
   }

   private async makeRequest<T>(method: HttpMethod, url: string, params?: any, body?: any): Promise<T | null> {

      const fullUrl: URL = new URL(`${this.host}/api${url}`);
      if (params instanceof Object) {
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
