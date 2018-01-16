/* Created by Alex and Christiana on Jan 15 2018 */

import AWS = require('aws-sdk');
import Logging = require('./../logging');

const cloudwatch = new AWS.CloudWatch({ region: 'us-east-2' });

const logger = Logging.consoleLogger();

const metrics: any = {
    Dimensions: [
        {
            Name: 'DBInstanceIdentifier', /* required */
            Value: 'nfl2015', /* required */
        },
        /* more items */
    ],
    EndTime: '2018-01-14T07:00:00Z', /* required */
    // ExtendedStatistics: [
    //     'STRING_VALUE',
    // ],
    MetricName: 'CPUUtilization', /* required */
    Namespace: 'AWS/RDS', /* required */
    Period: 60, /* required */
    StartTime: '2018-01-14T01:00:00Z', /* required */
    Statistics: [
        'Maximum',
        // "CPUUtilization", || NetworkIn | NetworkOut | FreeableMemory,
    ],
    Unit: 'Percent',
    // | Microseconds | Milliseconds | Bytes | Kilobytes | Megabytes |
    //     Gigabytes | Terabytes | Bits | Kilobits | Megabits | Gigabits | Terabits |
    //     Percent | Count | Bytes/Second | Kilobytes/Second | Megabytes/Second |
    //     Gigabytes/Second | Terabytes/Second | Bits/Second | Kilobits/Second |
    //     Megabits/Second | Gigabits/Second | Terabits/Second | Count/Second | None
};

export const getMetrics = () => {
    // logger.log("info", "metrics %s", metrics);
    logger.info(JSON.stringify(AWS.config));
    cloudwatch.getMetricStatistics(metrics, function onComplete(err, data) {
        if (err) { logger.log("info", "failed to get metrics %s", err.stack); }
        // tslint:disable-next-line:one-line
        else { logger.log("info", "%s", data); }
    });
};

// const getMetrics = cloudwatch.getMetricStatistics(metrics, function onComplete(err, data) {
//     if (err) { logger.log("info", "failed to get metrics %s", err.stack); } else { logger.log("info", "%s", data); }

// });
