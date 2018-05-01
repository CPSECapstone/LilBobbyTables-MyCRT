import { IMetricsList, MetricType } from '../data';

export class Metric {
    public metricType: string;
    public metricName: string;
    public unit: string;

    constructor(metricType: string, metricName: string, unit: string) {
        this.metricType = metricType;
        this.metricName = metricName;
        this.unit = unit;
    }
}

export interface IMetricsHash {
   [name: string]: Metric;
}

const metricsHash: IMetricsHash = {};
metricsHash[MetricType.CPU] = new Metric(MetricType.CPU, 'CPUUtilization', 'Percent');
metricsHash[MetricType.READ] = new Metric(MetricType.READ, 'ReadIOPS', 'Count/Second');
metricsHash[MetricType.WRITE] = new Metric(MetricType.WRITE, 'WriteIOPS', 'Count/Second');
metricsHash[MetricType.MEMORY] = new Metric(MetricType.MEMORY, 'FreeableMemory', 'Bytes');
metricsHash[MetricType.FREESTORAGE] = new Metric(MetricType.FREESTORAGE, 'FreeStorageSpace', 'Bytes');
metricsHash[MetricType.WRITETHROUGHPUT] = new Metric(MetricType.WRITETHROUGHPUT, 'WriteThroughput', 'Bytes/Second');
metricsHash[MetricType.READTHROUGHPUT] = new Metric(MetricType.READTHROUGHPUT, 'ReadThroughput', 'Bytes/Second');
export const MetricsHash = metricsHash;

/* Potential future metric types?
metricsHash[MetricType.BINLOGDISK] = new Metric(MetricType.BINLOGDISK, 'BinLogDiskUsage', 'Bytes');
metricsHash[MetricType.BURST] = new Metric(MetricType.BURST, 'BurstBalance', 'Percent');
metricsHash[MetricType.DBCONNECTIONS] = new Metric(MetricType.DBCONNECTIONS, 'DatabaseConnections', 'Count');
metricsHash[MetricType.DISKQUEUE] = new Metric(MetricType.DISKQUEUE, 'DiskQueueDepth', 'Count');
metricsHash[MetricType.NETWORKIN] = new Metric(MetricType.NETWORKIN, 'NetworkReceiveThroughput', 'Bytes/Second');
metricsHash[MetricType.NETWORKOUT] = new Metric(MetricType.NETWORKOUT, 'NetworkTransmitThroughput', 'Bytes/Second');
metricsHash[MetricType.READLATENCY] = new Metric(MetricType.READLATENCY, 'ReadLatency', 'Seconds');
metricsHash[MetricType.SWAPUSAGE] = new Metric(MetricType.SWAPUSAGE, 'SwapUsage', 'Bytes');
metricsHash[MetricType.WRITELATENCY] = new Metric(MetricType.WRITELATENCY, 'WriteLatency', 'Seconds');
*/
