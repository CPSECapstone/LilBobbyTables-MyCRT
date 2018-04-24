import { assert, expect, request } from 'chai';
import chaiHttp = require('chai-http');
import { Server } from 'http';
import * as http from 'http-status-codes';

import { IUser } from '@lbt-mycrt/common';

import MyCrtService from '../../main';

export class MyCrtServiceTestClient {

   public static asResponse(thing: any): ChaiHttp.Response {
      if (thing.response) {
         return thing.response as ChaiHttp.Response;
      } else {
         return thing as ChaiHttp.Response;
      }
   }

   public static describeRequestAndResponse(method: string, url: string, response: ChaiHttp.Response) {
      let body: string;
      if (typeof response.body === 'object') {
         body = JSON.stringify(response.body) || response.text;
      } else {
         body = JSON.stringify(response);
      }

      return `[Request: ${method} to ${url}] -> [Response: <${response.status}> | ${body}]`;
   }

   public user: IUser | undefined = undefined;

   private agent: ChaiHttp.Agent | null = null;

   constructor(public mycrt: MyCrtService) {}

   public async get(expectedStatus: number, url: string, params?: any): Promise<ChaiHttp.Response> {
      return this.doRequest(expectedStatus, 'GET', url, params);
   }

   public async post(expectedStatus: number, url: string, body?: any): Promise<ChaiHttp.Response> {
      return this.doRequest(expectedStatus, 'POST', url, null, body);
   }

   public async put(expectedStatus: number, url: string, body?: any): Promise<ChaiHttp.Response> {
      return this.doRequest(expectedStatus, 'PUT', url, null, body);
   }

   public async delete(expectedStatus: number, url: string): Promise<ChaiHttp.Response> {
      return this.doRequest(expectedStatus, 'DELETE', url);
   }

   private async doRequest(expectedStatus: number, method: string, url: string, params?: any,
         body?: any): Promise<ChaiHttp.Response> {

      if (this.agent === null) {
         this.agent = request.agent(this.mycrt.getServer());
      }

      method = method.toUpperCase();
      let response: ChaiHttp.Response;

      try {
         const server = this.mycrt.getServer();
         switch (method) {
            case 'GET':
               response = await this.agent.get(url).query(params);
               break;
            case 'POST':
               response = await this.agent.post(url).send(body);
               break;
            case 'PUT':
               response = await this.agent.put(url).send(body);
               break;
            case 'DELETE':
               response = await this.agent.del(url);
               break;
            default:
               throw Error(`Unsupported method: ${method} in MyCrtServiceTestClient`);
         }
      } catch (err) {
         response = MyCrtServiceTestClient.asResponse(err);
      }

      assert.equal(response.status, expectedStatus,
         MyCrtServiceTestClient.describeRequestAndResponse(method, url, response));

      return response;

   }

}
