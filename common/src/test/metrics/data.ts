import { IMetricsList, MetricType } from '../../data';
import { CPU, MEMORY, READ, WRITE } from '../../main';

export const dummyCPU = {
    Label: CPU,
    Datapoints: [],
};

export const dummyMemory = {
    Label: MEMORY,
    Datapoints: [],
};

export const dummyRead = {
    Label: READ,
    Datapoints: [],
};

export const dummyWrite = {
    Label: WRITE,
    Datapoints: [],
};

export const time1 = "2018-01-30T02:44:00.000Z";
export const time2 = "2018-01-30T02:45:00.000Z";
export const time3 = "2018-01-30T02:46:00.000Z";
export const time4 = "2018-01-30T02:47:00.000Z";
export const time5 = "2018-01-30T02:48:00.000Z";

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
