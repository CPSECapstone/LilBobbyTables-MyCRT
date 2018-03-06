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

export const CPUMetric = new Metric(MetricType.CPU, 'CPUUtilization', 'Percent');
export const ReadMetric = new Metric(MetricType.READ, 'ReadLatency', 'Seconds');
export const WriteMetric = new Metric(MetricType.WRITE, 'WriteLatency', 'Seconds');
export const MemoryMetric = new Metric(MetricType.MEMORY, 'FreeableMemory', 'Bytes');