/* Created by Alex and Christiana on Jan 15 2018 */

import AWS = require('aws-sdk');
import Logging = require('./../logging');

const cloudwatch = new AWS.CloudWatch({ region: 'us-east-2' });
const logger = Logging.consoleLogger();

// Metrics to retrieve
const CPU = 'CPUUtilization';
const IO = 'NetworkIn';
const MEMORY = 'FreeableMemory';

export class MetricConfiguration {
    public dimName: string;
    public dimValue: string;
    public period: number;
    public statistics: any;
    public percent: string;

    constructor(dimName: string, dimValue: string,
                period: number, statistics: any, percent: string) {
        this.dimName = dimName;
        this.dimValue = dimValue;
        this.period = period;
        this.statistics = statistics;
        this.percent = percent;
    }

    public getCPUMetrics(startTime: Date, endTime: Date) {
        return this.getMetrics(CPU, startTime, endTime);
    }

    public getIOMetrics(startTime: Date, endTime: Date) {
        return this.getMetrics(IO, startTime, endTime);
    }

    public getMemoryMetrics(startTime: Date, endTime: Date) {
        return this.getMetrics(MEMORY, startTime, endTime);
    }

    private getMetrics(metricName: string, startTime: Date, endTime: Date): Promise<any> {
        logger.info(JSON.stringify(AWS.config));
        // tslint:disable-next-line:max-line-length
        return new Promise<any>((resolve, reject) => {
            cloudwatch.getMetricStatistics(this.buildMetricRequest(metricName, startTime, endTime),
                function onMetricResult(err, data) {
                    // tslint:disable-next-line:max-line-length
                    if (err) {
                        logger.log("info", "failed to get metrics %s", err.stack);
                        reject(err.stack);
                    }
                    // tslint:disable-next-line:one-line
                    else {
                        resolve(data);
                    }
                });
        });
    }

    private buildMetricRequest(metricName: string, startTime: Date, endTime: Date) {
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
            Unit: this.percent,
        };
    }
}
