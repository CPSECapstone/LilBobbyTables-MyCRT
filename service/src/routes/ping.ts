import { Logging } from '@lbt-mycrt/common';
import { MetricConfiguration } from '@lbt-mycrt/common';
import AWS = require('aws-sdk');
import http = require('http-status-codes');
import * as mysql from 'mysql';
import SelfAwareRouter from './self-aware-router';
import ConnectionPool from './util/cnnPool';

export default class PingRouter extends SelfAwareRouter {

  public name: string = 'ping';
  public urlPrefix: string = '/ping';

  //  protected mountRoutes(): void {
  //     const logger = Logging.defaultLogger(__dirname);

  //     this.router.get('/', (request, response) => {
  //        const queryStr = mysql.format("SELECT * FROM Capture", []);
  //        ConnectionPool.query(response, queryStr, (error, rows, fields) => {
  //           response.json(rows);
  //        });
  //  });

  protected mountRoutes(): void {
    const logger = Logging.defaultLogger(__dirname);

    this.router.get('/', async (request, response) => {
      const cloudwatch = new AWS.CloudWatch({ region: 'us-east-2' });
      const m = new MetricConfiguration(cloudwatch, 'DBInstanceIdentifier', 'nfl2015', 60, ['Maximum']);
      const cpuMetrics = await m.getCPUMetrics(new Date(2018, 0, 14, 1, 0, 0), new Date(2018, 0, 14, 7, 0, 0));
      response.json(cpuMetrics);
    });
  }
}
