import * as http from 'http-status-codes';

import { IAwsKeys, ICapture, IChildProgram, IDbReference, IEnvironment, IEnvironmentFull,
   IEnvironmentUser, IMetricsList, IReplay, IReplayFull, IS3Reference, IUser, MetricType,
   } from '@lbt-mycrt/common/dist/data';

import { IMyCrtClientDelegate } from './client-delegate';
import * as types from './types';

export enum HttpMethod { GET = 'GET', POST = 'POST', PUT = 'PUT', DELETE = 'DELETE' }

export interface ServiceError {
   ok: boolean;
   message: string;
}

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

   constructor(origin: string, delegate: IMyCrtClientDelegate) {
      this.host = origin;
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

   /** Retrieve all of the captures for an environment */
   public async getCapturesForEnvironment(envId: number): Promise<ICapture[] | null> {
    return this.makeRequest<ICapture[]>(HttpMethod.GET, '/captures', {envId});
   }

   /** Delete a specific capture. Optional: Delete the S3 logs associated with it */
   public async deleteCapture(id: number, removeLogs?: boolean): Promise<void> {
      return this.makeRequest<any>(HttpMethod.DELETE, `/captures/${id}`, {deleteLogs: removeLogs});
   }

   /** Create a new Replay */
   public async startReplay(replay: IReplayFull): Promise<number | ServiceError | null> {
      return this.makeRequest<number>(HttpMethod.POST, '/replays', null, replay);
   }

   /** Retrieve all of the replays */
   public async getReplays(): Promise<IChildProgram[] | null> {
      return this.makeRequest<IChildProgram[]>(HttpMethod.GET, '/replays');
   }

   /** Retrieve all of the replays associated with a given capture */
   public async getReplaysForCapture(cID: number): Promise<IChildProgram[] | null> {
      return this.makeRequest<IChildProgram[]>(HttpMethod.GET, `/replays`, {captureId: cID});
   }

   /** Retrieve a specific replay */
   public async getReplay(id: number): Promise<IChildProgram | null> {
      return this.makeRequest<IChildProgram>(HttpMethod.GET, `/replays/${id}`);
   }

   /** Retrieve a set of specific metrics for a Replay. */
   public async getReplayMetrics(id: number, type: MetricType): Promise<IMetricsList | null> {
      return this.makeRequest<IMetricsList>(HttpMethod.GET, `/replays/${id}/metrics`, {type: type.toString()});
   }

   /** Retrieve all of the metrics for a Replay */
  public async getAllReplayMetrics(id: number): Promise<[IMetricsList] | null> {
    return this.makeRequest<[IMetricsList]>(HttpMethod.GET, `/replays/${id}/metrics`);
  }

   /** Delete a specific replay */
   public async deleteReplay(id: number, removeLogs?: boolean): Promise<any> {
      return this.makeRequest<any>(HttpMethod.DELETE, `/replays/${id}`, {deleteLogs: removeLogs});
   }

   /** Create a new Environment */
   public async createEnvironment(environment: IEnvironmentFull): Promise<IEnvironment | null> {
      return this.makeRequest<IEnvironment | null>(HttpMethod.POST, '/environments', null, environment);
   }

   /** Retrieve a specific environment */
   public async getEnvironment(id: number): Promise<IEnvironmentFull | null> {
      return this.makeRequest<IEnvironmentFull>(HttpMethod.GET, `/environments/${id}`);
   }

   /** Retrieve all of the environments */
   public async getEnvironments(): Promise<IEnvironment[] | null> {
      return this.makeRequest<IEnvironment[]>(HttpMethod.GET, '/environments');
   }

   /** Edit an environment given the envId and the desired changes */
   public async editEnvironment(id: number, changes: IEnvironment): Promise<IEnvironment | null> {
      return this.makeRequest<IEnvironment>(HttpMethod.PUT, `/environments/${id}`, null, changes);
   }

   /** Delete a specific environment */
   public async deleteEnvironment(id: number, removeLogs?: boolean): Promise<void> {
      return this.makeRequest<any>(HttpMethod.DELETE, `/environments/${id}`, {deleteLogs: removeLogs});
   }

   /** Validate environment name when creating an environment */
   public async validateEnvName(name: string): Promise<any | null> {
      return this.makeRequest<any>(HttpMethod.GET, '/environments/', {name});
   }

   /** Validate capture name when creating a capture */
   public async validateCaptureName(name: string, envId: number): Promise<any | null> {
      return this.makeRequest<any>(HttpMethod.GET, '/captures/', {envId, name});
   }

   /** Validate replay name when creating a replay */
   public async validateReplayName(name: string, captureId: number): Promise<any | null> {
      return this.makeRequest<any>(HttpMethod.GET, '/replays/', {captureId, name});
   }

   /** Validate credentials when creating an environment */
   public async validateCredentials(awsKeys: IAwsKeys): Promise<IDbReference[] | null> {
      return this.makeRequest<IDbReference[]>(HttpMethod.POST, `/validate/credentials`, null, awsKeys);
   }

   /** Validate buckets when creating an environment */
   public async validateBuckets(awsKeys: IAwsKeys): Promise< string[] | null> {
      return this.makeRequest<string[]>(HttpMethod.POST, `/validate/bucket`, null, awsKeys);
   }

   /** Valid database credentials when creating an environment */
   public async validateDatabase(dbRef: IDbReference): Promise<any | null> {
     return this.makeRequest<any>(HttpMethod.POST, '/validate/database', null, dbRef);
   }

   /** Get database credentials for a replay */
   public async getReplayDB(id: number): Promise<IDbReference | null> {
      return this.makeRequest<IDbReference>(HttpMethod.GET, `/dbReferences/${id}`);
   }

   public async getAWSKeys(): Promise<any[] | null> {
      return this.makeRequest<any[]>(HttpMethod.GET, '/awsKeys', null);
   }

   public validateAWSKeyName(keysName: string): Promise<any | null> {
      return this.makeRequest<any>(HttpMethod.POST, '/validate/credentials/name', null, {keysName});
   }

   /** Signup to MyCRT */
   public async signup(user: types.SignupBody): Promise<IUser | null> {
      return this.makeRequest<IUser>(HttpMethod.POST, '/users/signup', null, user);
   }

   /** Login to MyCRT */
   public async login(user: types.LoginBody): Promise<IUser | null> {
      return this.makeRequest<IUser>(HttpMethod.POST, '/users/login', null, user);
   }

   /** Get info about the current user */
   public async aboutMe(): Promise<IUser | null> {
      return this.makeRequest<IUser>(HttpMethod.GET, '/users/me', null);
   }

   /** Logout */
   public async logout(): Promise<void | null> {
      return this.makeRequest<any>(HttpMethod.PUT, '/users/logout');
   }

   /**
    * Create an invitation to an environment. The response will have an inviteCode on the body.
    * The given user must then accept the invitation with that invite code.
    * @param environmentId The id of the environment to invite the user to
    * @param userEmail The email address of the user to invite
    */
   public async environmentInvite(environmentId: number, userEmail: string):
         Promise<IEnvironmentUser | null> {
      return this.makeRequest<IEnvironmentUser>(HttpMethod.POST, '/environments/invites', null, {
         environmentId,
         userEmail,
      });
   }

   /**
    * Accept an invitation to an environment. Invitation codes expire after 24 hours.
    * @param inviteCode The invitation code (previously created).
    */
   public async acceptEnvironmentInvite(inviteCode: string): Promise<IEnvironmentFull | null> {
      return this.makeRequest<any>(HttpMethod.PUT, '/environments/invites/accept', null, {
         inviteCode,
      });
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
         credentials: 'include',
         method,
      };
      // this.delegate.logger.info(`options: ${JSON.stringify(options)}`);

      const response = await this.delegate.fetch(fullUrl, options).catch(this.delegate.onError);

      if (response) {
         this.delegate.logger.info(`MyCRT responded with status ${response.status}`);
         if (response.ok) {
            const json = await response.json();
            if (json) {
               return json as T;
            }
         }
         // } else {
         //    const json = await response.json();
         //    const serviceError: ServiceError = {
         //       ok: false,
         //       message: json.message || "There was an error",
         //    };
         //    return serviceError as any;
         // }
      }

      return null;

   }

}
