/* Created by Alex and Christiana on Jan 15 2018 */

import AWS = require('aws-sdk');
export import Logging = require('./../logging');

const cloudwatch = new AWS.CloudWatch();
const logger = Logging.consoleLogger();

const metrics = {
    Dimensions: [
        {
            Name: 'STRING_VALUE', /* required */
            Value: 'STRING_VALUE', /* required */
        },
        /* more items */
    ],
    EndTime: new Date() || 'Wed Dec 31 1969 16:00:00 GMT-0800 (PST)' || 123456789, /* required */
    ExtendedStatistics: [
        'STRING_VALUE',
    ],
    MetricName: 'STRING_VALUE', /* required */
    Namespace: 'STRING_VALUE', /* required */
    Period: 0, /* required */
    StartTime: new Date() || 'Wed Dec 31 1969 16:00:00 GMT-0800 (PST)' || 123456789, /* required */
    Statistics: [
        "CPUUtilization", // || NetworkIn | NetworkOut | FreeableMemory,
    ],
    // Unit: Seconds | Microseconds | Milliseconds | Bytes | Kilobytes | Megabytes |
    //     Gigabytes | Terabytes | Bits | Kilobits | Megabits | Gigabits | Terabits |
    //     Percent | Count | Bytes/Second | Kilobytes/Second | Megabytes/Second |
    //     Gigabytes/Second | Terabytes/Second | Bits/Second | Kilobits/Second |
    //     Megabits/Second | Gigabits/Second | Terabits/Second | Count/Second | None
};

cloudwatch.getMetricStatistics(metrics, function onComplete(err, data) {
    if (err) { logger.log("info", "failed to get metrics %s", err.stack); } else { logger.log("info", "%s", data); }
});
