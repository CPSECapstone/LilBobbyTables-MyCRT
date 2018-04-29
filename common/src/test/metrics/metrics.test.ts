import { CloudWatch } from 'aws-sdk';
import { expect } from 'chai';
import 'mocha';
import mockito from 'ts-mockito';
import { CloudWatchMetricsBackend, Metric, MetricsHash, MetricType } from '../../main';
import { dummyCPU, dummyFreeStorage, dummyMemory, dummyRead, dummyReadThroughput,
   dummyWrite, dummyWriteThroughput } from './data';

import Logging = require('./../../logging');

const logger = Logging.consoleLogger();

const CPUMetric = MetricsHash[MetricType.CPU];
const ReadMetric = MetricsHash[MetricType.READ];
const WriteMetric = MetricsHash[MetricType.WRITE];
const MemoryMetric = MetricsHash[MetricType.MEMORY];
const WriteThroughput = MetricsHash[MetricType.WRITETHROUGHPUT];
const ReadThroughput = MetricsHash[MetricType.READTHROUGHPUT];
const FreeStorage = MetricsHash[MetricType.FREESTORAGE];

describe("CloudwatchMetricsBackend", () => {

   let cloudwatch: CloudWatch;
   let spiedCloudwatch: CloudWatch;
   let metrics: CloudWatchMetricsBackend;

   before(() => {
      cloudwatch = new CloudWatch({ region: 'us-east-2' });
      spiedCloudwatch = mockito.spy(cloudwatch);
      metrics = new CloudWatchMetricsBackend(cloudwatch, 'DBInstanceIdentifier', 'nfl2015', 60, ['Maximum']);
   });

   it("should get CPU metrics", async () => {
      mockito.when(spiedCloudwatch.getMetricStatistics(mockito.anything(), mockito.anyFunction()))
         .thenCall((params, callback) => {
            callback(null, {
               Label: dummyCPU.Label,
               Datapoints: dummyCPU.Datapoints,
            } as CloudWatch.GetMetricStatisticsOutput);
         });

      await metrics.getMetricsForType(CPUMetric, new Date(), new Date())
         .then((cpuMetrics) => {
            expect(cpuMetrics.label).to.equal(dummyCPU.Label);
            expect(cpuMetrics.dataPoints).to.deep.equal(dummyCPU.Datapoints);
         });

   });

   it("should get read IO metrics", async () => {
      mockito.when(spiedCloudwatch.getMetricStatistics(mockito.anything(), mockito.anyFunction()))
         .thenCall((params, callback) => {
            callback(null, {
               Label: dummyRead.Label,
               Datapoints: dummyRead.Datapoints,
            } as CloudWatch.GetMetricStatisticsOutput);
         });

      await metrics.getMetricsForType(ReadMetric, new Date(), new Date())
         .then((readMetrics) => {
            expect(readMetrics.label).to.equal(dummyRead.Label);
            expect(readMetrics.dataPoints).to.deep.equal(dummyRead.Datapoints);
         });

   });

   it("should get write IO metrics", async () => {
      mockito.when(spiedCloudwatch.getMetricStatistics(mockito.anything(), mockito.anyFunction()))
         .thenCall((params, callback) => {
            callback(null, {
               Label: dummyWrite.Label,
               Datapoints: dummyWrite.Datapoints,
            } as CloudWatch.GetMetricStatisticsOutput);
         });

      await metrics.getMetricsForType(WriteMetric, new Date(), new Date())
         .then((writeMetrics) => {
            expect(writeMetrics.label).to.equal(dummyWrite.Label);
            expect(writeMetrics.dataPoints).to.deep.equal(dummyWrite.Datapoints);
         });

   });

   it("should get memory metrics", async () => {
      mockito.when(spiedCloudwatch.getMetricStatistics(mockito.anything(), mockito.anyFunction()))
         .thenCall((params, callback) => {
            callback(null, {
               Label: dummyMemory.Label,
               Datapoints: dummyMemory.Datapoints,
            } as CloudWatch.GetMetricStatisticsOutput);
         });

      await metrics.getMetricsForType(MemoryMetric, new Date(), new Date())
         .then((memoryMetrics) => {
            expect(memoryMetrics.label).to.equal(dummyMemory.Label);
            expect(memoryMetrics.dataPoints).to.deep.equal(dummyMemory.Datapoints);
         });

   });

   it("should get read throughput metrics", async () => {
      mockito.when(spiedCloudwatch.getMetricStatistics(mockito.anything(), mockito.anyFunction()))
         .thenCall((params, callback) => {
            callback(null, {
               Label: dummyReadThroughput.Label,
               Datapoints: dummyReadThroughput.Datapoints,
            } as CloudWatch.GetMetricStatisticsOutput);
         });

      await metrics.getMetricsForType(ReadThroughput, new Date(), new Date())
         .then((readThruMetrics) => {
            expect(readThruMetrics.label).to.equal(dummyReadThroughput.Label);
            expect(readThruMetrics.dataPoints).to.deep.equal(dummyReadThroughput.Datapoints);
         });

   });

   it("should get write throughput metrics", async () => {
      mockito.when(spiedCloudwatch.getMetricStatistics(mockito.anything(), mockito.anyFunction()))
         .thenCall((params, callback) => {
            callback(null, {
               Label: dummyWriteThroughput.Label,
               Datapoints: dummyWriteThroughput.Datapoints,
            } as CloudWatch.GetMetricStatisticsOutput);
         });

      await metrics.getMetricsForType(WriteThroughput, new Date(), new Date())
         .then((writeThruMetrics) => {
            expect(writeThruMetrics.label).to.equal(dummyWriteThroughput.Label);
            expect(writeThruMetrics.dataPoints).to.deep.equal(dummyWriteThroughput.Datapoints);
         });

   });

   it("should get free storage metrics", async () => {
      mockito.when(spiedCloudwatch.getMetricStatistics(mockito.anything(), mockito.anyFunction()))
         .thenCall((params, callback) => {
            callback(null, {
               Label: dummyFreeStorage.Label,
               Datapoints: dummyFreeStorage.Datapoints,
            } as CloudWatch.GetMetricStatisticsOutput);
         });

      await metrics.getMetricsForType(FreeStorage, new Date(), new Date())
         .then((storageMetrics) => {
            expect(storageMetrics.label).to.equal(dummyFreeStorage.Label);
            expect(storageMetrics.dataPoints).to.deep.equal(dummyFreeStorage.Datapoints);
         });

   });

   it("should fail to get CPU metrics", async () => {
      mockito.when(spiedCloudwatch.getMetricStatistics(mockito.anything(), mockito.anyFunction()))
         .thenCall((params, callback) => {
            callback("cpu metrics do not exist", null);
         });

      const cpuMetrics = await metrics.getMetricsForType(CPUMetric, new Date(), new Date())
         .catch((reason) => {
            expect(reason).to.not.be.null;
         });
   });

   it("should fail to get read IO metrics", async () => {
      mockito.when(spiedCloudwatch.getMetricStatistics(mockito.anything(), mockito.anyFunction()))
         .thenCall((params, callback) => {
            callback("read (io) metrics do not exist", null);
         });

      const readMetrics = await metrics.getMetricsForType(ReadMetric, new Date(), new Date())
         .catch((reason) => {
            expect(reason).to.not.be.null;
         });
   });

   it("should fail to get write IO metrics", async () => {
      mockito.when(spiedCloudwatch.getMetricStatistics(mockito.anything(), mockito.anyFunction()))
         .thenCall((params, callback) => {
            callback("write (io) metrics do not exist", null);
         });

      const writeMetrics = await metrics.getMetricsForType(WriteMetric, new Date(), new Date())
         .catch((reason) => {
            expect(reason).to.not.be.null;
         });
   });

   it("should fail to get memory metrics", async () => {
      mockito.when(spiedCloudwatch.getMetricStatistics(mockito.anything(), mockito.anyFunction()))
         .thenCall((params, callback) => {
            callback("memory metrics do not exist", null);
         });

      const memoryMetrics = await metrics.getMetricsForType(MemoryMetric, new Date(), new Date())
         .catch((reason) => {
            expect(reason).to.not.be.null;
         });
   });

   it("should fail to get read throughput metrics", async () => {
      mockito.when(spiedCloudwatch.getMetricStatistics(mockito.anything(), mockito.anyFunction()))
         .thenCall((params, callback) => {
            callback("read throughput metrics do not exist", null);
         });

      const readThruputMetrics = await metrics.getMetricsForType(ReadThroughput, new Date(), new Date())
         .catch((reason) => {
            expect(reason).to.not.be.null;
         });
   });

   it("should fail to get write throughput metrics", async () => {
      mockito.when(spiedCloudwatch.getMetricStatistics(mockito.anything(), mockito.anyFunction()))
         .thenCall((params, callback) => {
            callback("write throughput metrics do not exist", null);
         });

      const writeThruputMetrics = await metrics.getMetricsForType(WriteThroughput, new Date(), new Date())
         .catch((reason) => {
            expect(reason).to.not.be.null;
         });
   });

   it("should fail to get free storage metrics", async () => {
      mockito.when(spiedCloudwatch.getMetricStatistics(mockito.anything(), mockito.anyFunction()))
         .thenCall((params, callback) => {
            callback("free storage metrics do not exist", null);
         });

      const freeStorageMetrics = await metrics.getMetricsForType(FreeStorage, new Date(), new Date())
         .catch((reason) => {
            expect(reason).to.not.be.null;
         });
   });

});
