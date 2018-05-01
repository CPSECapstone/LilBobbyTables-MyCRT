import { IMetricsList, MetricType } from '../../data';
import { MetricsHash } from '../../main';

const CPUMetric = MetricsHash[MetricType.CPU];
const ReadMetric = MetricsHash[MetricType.READ];
const WriteMetric = MetricsHash[MetricType.WRITE];
const MemoryMetric = MetricsHash[MetricType.MEMORY];
const WriteThroughput = MetricsHash[MetricType.WRITETHROUGHPUT];
const ReadThroughput = MetricsHash[MetricType.READTHROUGHPUT];
const FreeStorage = MetricsHash[MetricType.FREESTORAGE];

export const dummyCPU = {
    Label: CPUMetric.metricName,
    Datapoints: [],
};

export const dummyMemory = {
    Label: MemoryMetric.metricName,
    Datapoints: [],
};

export const dummyRead = {
    Label: ReadMetric.metricName,
    Datapoints: [],
};

export const dummyWrite = {
    Label: WriteMetric.metricName,
    Datapoints: [],
};

export const dummyReadThroughput = {
   Label: ReadThroughput.metricName,
   Datapoints: [],
};

export const dummyWriteThroughput = {
   Label: WriteThroughput.metricName,
   Datapoints: [],
};

export const dummyFreeStorage = {
   Label: FreeStorage.metricName,
   Datapoints: [],
};

export const time1 = "2018-01-30T02:44:00.000Z";
export const time2 = "2018-01-30T02:45:00.000Z";
export const time3 = "2018-01-30T02:46:00.000Z";
export const time4 = "2018-01-30T02:47:00.000Z";
export const time5 = "2018-01-30T02:48:00.000Z";

export const metricsAllTypes: IMetricsList[] = [
   {
      label: "cpu",
      type: MetricType.CPU,
      dataPoints: [],
   },
   {
      label: "memory",
      type: MetricType.MEMORY,
      dataPoints: [],
   },
   {
      label: "read",
      type: MetricType.READ,
      dataPoints: [],
   },
   {
      label: "write",
      type: MetricType.WRITE,
      dataPoints: [],
   },
];

export const metricsA: IMetricsList[] = [
   {
      label: 'CPU label',
      type: MetricType.CPU,
      dataPoints: [
         {
            Timestamp: time1,
            Maximum: 1,
            Unit: 'unit',
         },
         {
            Timestamp: time3,
            Maximum: 3,
            Unit: 'unit',
         },
         {
            Timestamp: time2,
            Maximum: 2,
            Unit: 'unit',
         },
      ],
   },
   {
      label: 'IO label',
      type: MetricType.READ,
      dataPoints: [
         {
            Timestamp: time3,
            Maximum: 2,
            Unit: 'unit',
         },
         {
            Timestamp: time1,
            Maximum: 1,
            Unit: 'unit',
         },
         {
            Timestamp: time2,
            Maximum: 2,
            Unit: 'unit',
         },
      ],
   },
];

export const metricsB: IMetricsList[] = [
   {
      label: 'CPU label',
      type: MetricType.CPU,
      dataPoints: [
         {
            Timestamp: time4,
            Maximum: 4,
            Unit: 'unit',
         },
         {
            Timestamp: time3,
            Maximum: 3,
            Unit: 'unit',
         },
         {
            Timestamp: time5,
            Maximum: 5,
            Unit: 'unit',
         },
      ],
   },
   {
      label: 'IO label',
      type: MetricType.READ,
      dataPoints: [
         {
            Timestamp: time3,
            Maximum: 2,
            Unit: 'unit',
         },
         {
            Timestamp: time5,
            Maximum: 5,
            Unit: 'unit',
         },
         {
            Timestamp: time4,
            Maximum: 4,
            Unit: 'unit',
         },
      ],
   },
];
