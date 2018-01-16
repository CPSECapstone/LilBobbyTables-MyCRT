/* Created by Alex and Christiana on Jan 15 2018 */

import AWS = require('aws-sdk');
export import Logging = require('./../logging');

const cloudwatch = new AWS.CloudWatch();
const logger = Logging.consoleLogger();

const metrics = {
    Dimensions: [
        {
            Name: 'DBInstanceIdentifier', /* required */
            Value: 'nfl2015', /* required */
        },
        /* more items */
    ],
    EndTime: new Date() || 'Mon Jan 14 2018 07:00:00 GMT-0800 (PST)' || 123456789, /* required */
    // ExtendedStatistics: [
    //     'STRING_VALUE',
    // ],
    MetricName: 'CPUUtilization', /* required */
    Namespace: 'AWS/RDS', /* required */
    Period: 60, /* required */
    StartTime: new Date() || 'Mon Jan 14 2018 1:00:00 GMT-0800 (PST)' || 123456789, /* required */
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

cloudwatch.getMetricStatistics(metrics, function onComplete(err, data) {
    if (err) { logger.log("info", "failed to get metrics %s", err.stack); } else { logger.log("info", "%s", data); }
});
