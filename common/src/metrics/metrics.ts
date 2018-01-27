/* Created by Alex and Christiana on Jan 15 2018 */

import AWS = require('aws-sdk');

import { IMetric, IMetricsList, MetricType } from '../data';
import Logging = require('./../logging');

const cloudwatch = new AWS.CloudWatch({ region: 'us-east-2' });
const logger = Logging.consoleLogger();

// Metrics to retrieve
const CPU = 'CPUUtilization';
const IO = 'ReadLatency';
const MEMORY = 'FreeableMemory';

const nameToType = (name: string): MetricType => {
   switch (name) {
      case CPU:
         return MetricType.CPU;
      case IO:
         return MetricType.IO;
      case MEMORY:
         return MetricType.MEMORY;
      default:
         throw new Error();
   }
};

const toIMetricsList = (data: AWS.CloudWatch.GetMetricStatisticsOutput): IMetricsList => {
   const labelStr = data.Label || CPU;
   return {
      label: labelStr,
      type: nameToType(labelStr),
      displayName: nameToType(labelStr),
      live: false,
      dataPoints: (data.Datapoints || []) as any,
   };
};

export class MetricConfiguration {
    public dimName: string;
    public dimValue: string;
    public period: number;
    public statistics: any;

    constructor(dimName: string, dimValue: string,
                period: number, statistics: any) {
        this.dimName = dimName;
        this.dimValue = dimValue;
        this.period = period;
        this.statistics = statistics;
    }

    public getCPUMetrics(startTime: Date, endTime: Date) {
        return this.getMetrics(CPU, startTime, endTime, 'Percent');
    }

    public getIOMetrics(startTime: Date, endTime: Date) {
        return this.getMetrics(IO, startTime, endTime, 'Seconds');
    }

    public getMemoryMetrics(startTime: Date, endTime: Date) {
        return this.getMetrics(MEMORY, startTime, endTime, 'Bytes');
    }

    private getMetrics(metricName: string, startTime: Date, endTime: Date, unit: string): Promise<IMetricsList> {
        logger.info(JSON.stringify(AWS.config));
        return new Promise<IMetricsList>((resolve, reject) => {
            cloudwatch.getMetricStatistics(this.buildMetricRequest(metricName, startTime, endTime, unit),
                function onMetricResult(err, data) {
                    if (err) {
                        logger.log("info", "failed to get metrics %s", err.stack);
                        reject(err.stack);
                    } else {
                        resolve(toIMetricsList(data));
                    }
                });
        });
    }

    private buildMetricRequest(metricName: string, startTime: Date, endTime: Date, unit: string) {
        return {
            Dimensions: [
                {
                    Name: this.dimName,
                    Value: this.dimValue,
                },
            ],
            EndTime: endTime,
            MetricName: metricName,
            Namespace: 'AWS/RDS',
            Period: this.period,
            StartTime: startTime,
            Statistics: this.statistics,
            Unit: unit,
        };
    }
}
