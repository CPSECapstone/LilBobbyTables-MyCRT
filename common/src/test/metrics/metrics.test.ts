import { CloudWatch } from 'aws-sdk';
import { expect } from 'chai';
import 'mocha';
import mockito from 'ts-mockito';
import { CloudWatchMetricsBackend, CPU, MEMORY, READ, WRITE } from '../../main';
import { dummyCPU, dummyMemory, dummyRead, dummyWrite } from './data';

import Logging = require('./../../logging');

const logger = Logging.consoleLogger();

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

        await metrics.getCPUMetrics(new Date(), new Date())
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

        await metrics.getReadMetrics(new Date(), new Date())
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

        await metrics.getWriteMetrics(new Date(), new Date())
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

        await metrics.getMemoryMetrics(new Date(), new Date())
         .then((memoryMetrics) => {
            expect(memoryMetrics.label).to.equal(dummyMemory.Label);
            expect(memoryMetrics.dataPoints).to.deep.equal(dummyMemory.Datapoints);
         });

    });

    it("should fail to get CPU metrics", async () => {
        mockito.when(spiedCloudwatch.getMetricStatistics(mockito.anything(), mockito.anyFunction()))
        .thenCall((params, callback) => {
            callback("cpu metrics do not exist", null);
        });

        const cpuMetrics = await metrics.getCPUMetrics(new Date(), new Date())
         .catch((reason) => {
            expect(reason).to.not.be.null;
         });
    });

    it("should fail to get read IO metrics", async () => {
        mockito.when(spiedCloudwatch.getMetricStatistics(mockito.anything(), mockito.anyFunction()))
        .thenCall((params, callback) => {
            callback("read (io) metrics do not exist", null);
        });

        const readMetrics = await metrics.getReadMetrics(new Date(), new Date())
         .catch((reason) => {
            expect(reason).to.not.be.null;
         });
    });

    it("should fail to get write IO metrics", async () => {
        mockito.when(spiedCloudwatch.getMetricStatistics(mockito.anything(), mockito.anyFunction()))
        .thenCall((params, callback) => {
            callback("write (io) metrics do not exist", null);
        });

        const writeMetrics = await metrics.getWriteMetrics(new Date(), new Date())
         .catch((reason) => {
            expect(reason).to.not.be.null;
         });
    });

    it("should fail to get memory metrics", async () => {
        mockito.when(spiedCloudwatch.getMetricStatistics(mockito.anything(), mockito.anyFunction()))
        .thenCall((params, callback) => {
            callback("memory metrics do not exist", null);
        });

        const memoryMetrics = await metrics.getMemoryMetrics(new Date(), new Date())
         .catch((reason) => {
            expect(reason).to.not.be.null;
         });
    });

});
