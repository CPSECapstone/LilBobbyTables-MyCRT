/* Created by Alex and Christiana on Jan 15 2018 */

import AWS = require('aws-sdk');
import { AWSError, CloudWatch } from 'aws-sdk';
import { IMetric, IMetricsList, MetricType } from '../data';
import Logging = require('./../logging');

const logger = Logging.consoleLogger();

// Metrics to retrieve
export const CPU = 'CPUUtilization';
export const IO = 'ReadLatency';
export const MEMORY = 'FreeableMemory';

const cpuUnit = 'Percent';
const ioUnit = 'Seconds';
const memoryUnit = 'Bytes';

const nameToType = (name: string): MetricType => {
    logger.info(name);
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

const toIMetricsList = (data: CloudWatch.GetMetricStatisticsOutput): IMetricsList => {
    const labelStr = data.Label || CPU;
    logger.info(labelStr);
    return {
        label: labelStr,
        type: nameToType(labelStr),
        displayName: nameToType(labelStr),
        live: false,
        dataPoints: (data.Datapoints || []) as any,
    };
};

export class MetricConfiguration {
    public cloudwatch: CloudWatch;
    public dimName: string;
    public dimValue: string;
    public period: number;
    public statistics: string[];

    constructor(cloudwatch: CloudWatch, dimName: string, dimValue: string,
                period: number, statistics: string[]) {
        this.cloudwatch = cloudwatch;
        this.dimName = dimName;
        this.dimValue = dimValue;
        this.period = period;
        this.statistics = statistics;
    }

    public getCPUMetrics(startTime: Date, endTime: Date) {
        return this.getMetrics(CPU, startTime, endTime, cpuUnit);
    }

    public getIOMetrics(startTime: Date, endTime: Date) {
        return this.getMetrics(IO, startTime, endTime, ioUnit);
    }

    public getMemoryMetrics(startTime: Date, endTime: Date) {
        return this.getMetrics(MEMORY, startTime, endTime, memoryUnit);
    }

    private getMetrics(metricName: string, startTime: Date, endTime: Date, unit: string): Promise<IMetricsList> {
        logger.info(JSON.stringify(AWS.config));
        return new Promise<IMetricsList>((resolve, reject) => {
            this.cloudwatch.getMetricStatistics(this.buildMetricRequest(metricName, startTime, endTime, unit),
                function onMetricResult(err: AWSError, data: CloudWatch.GetMetricStatisticsOutput) {
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
