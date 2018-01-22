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
    public endTime: Date;
    public startTime: Date;
    public period: number;
    public statistics: any;
    public percent: string;

    constructor(dimName: string, dimValue: string, endTime: Date, startTime: Date,
                period: number, statistics: any, percent: string) {
            this.dimName = dimName;
            this.dimValue = dimValue;
            this.endTime = endTime;
            this.startTime = startTime;
            this.period = period;
            this.statistics = statistics;
            this.percent = percent;
        }

    public getCPUMetrics = () => {
        this.getMetrics(CPU);
    }

    public getIOMetrics = () => {
        this.getMetrics(IO);
    }

    public getMemoryMetrics = () => {
        this.getMetrics(MEMORY);
    }

    private getMetrics(metricName: string) {
        logger.info(JSON.stringify(AWS.config));
        cloudwatch.getMetricStatistics(this.buildMetricRequest(metricName), function onComplete(err, data) {
            // tslint:disable-next-line:max-line-length
            if (err) { logger.log("info", "failed to get metrics %s", err.stack); } else { logger.log("info", "%s", data); }
        });
    }

    private buildMetricRequest(metricName: string) {
        return {
                    Dimensions: [
                    {
                        Name: this.dimName,
                        Value: this.dimValue,
                    },
                ],
                EndTime: this.endTime,
                MetricName: metricName,
                Namespace: 'AWS/RDS',
                Period: this.period,
                StartTime: this.startTime,
                Statistics: this.statistics, // "CPUUtilization", || NetworkIn | NetworkOut | FreeableMemory,
                Unit: this.percent,
            };
        }
}

// temp global variables
// const mdimName = 'DBInstanceIdentifier';
// const mdimValue = 'nfl2015';
// const mendTime = '2018-01-14T07:00:00Z';
// const mstartTime = '2018-01-14T01:00:00Z';
// const mmetricName = 'CPUUtilization';
// const mnameSpace = 'AWS/RDS';
// const mperiod = 60;
// const mstatistics = 'Maximum';
// const mpercent = 'Percent';

// const testMetrics = new MetricConfiguration('DBInstanceIdentifier', 'nfl2015', '2018-01-14T07:00:00Z',
//                                         '2018-01-14T01:00:00Z', 60, 'Maximum', 'Percent');
// testMetrics.getCPUMetrics();
