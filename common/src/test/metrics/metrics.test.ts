import { CloudWatch } from 'aws-sdk';
import { expect } from 'chai';
import 'mocha';
import mockito from 'ts-mockito';
import { CloudWatchMetricsBackend, CPU, IO, MEMORY } from '../../main';
import { dummyCPU, dummyIO, dummyMemory } from './data';

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

    it("should get IO metrics", async () => {
        mockito.when(spiedCloudwatch.getMetricStatistics(mockito.anything(), mockito.anyFunction()))
        .thenCall((params, callback) => {
            callback(null, {
                Label: dummyIO.Label,
                Datapoints: dummyIO.Datapoints,
            } as CloudWatch.GetMetricStatisticsOutput);
        });

        await metrics.getIOMetrics(new Date(), new Date())
         .then((ioMetrics) => {
            expect(ioMetrics.label).to.equal(dummyIO.Label);
            expect(ioMetrics.dataPoints).to.deep.equal(dummyIO.Datapoints);
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

    it("should fail to get IO metrics", async () => {
        mockito.when(spiedCloudwatch.getMetricStatistics(mockito.anything(), mockito.anyFunction()))
        .thenCall((params, callback) => {
            callback("io metrics do not exist", null);
        });

        const ioMetrics = await metrics.getIOMetrics(new Date(), new Date())
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
