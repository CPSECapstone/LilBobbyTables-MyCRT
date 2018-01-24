// import { expect } from 'chai';
// import 'mocha';
// import { MetricConfiguration } from '../../main';

/* tslint:disable no-unused-expression */

// describe("Metrics", () => {

//     let metrics: MetricConfiguration;
//     let cpuMetrics: any;
//     let memoryMetrics: any;
//     let ioMetrics: any;

//     before(() => {
//         metrics = new MetricConfiguration('DBInstanceIdentifier', 'nfl2015', 60, ['Maximum'], 'Percent');
//     });

//     it("should get CPU metrics", async () => {
//         cpuMetrics = await metrics.getCPUMetrics(new Date(2018, 0, 14, 1, 0, 0), new Date(2018, 0, 14, 7, 0, 0));
//         expect(cpuMetrics.Label).to.equal('CPUUtilization');
//     });

//     it("should get Memory metrics", async () => {
//         memoryMetrics = await metrics.getMemoryMetrics(new Date(2018, 0, 14, 1, 0, 0), new Date(2018, 0, 14, 7, 0, 0));
//         expect(memoryMetrics.Label).to.equal('FreeableMemory');
//     });

//     it("should get IO metrics", async () => {
//         ioMetrics = await metrics.getIOMetrics(new Date(2018, 0, 14, 1, 0, 0), new Date(2018, 0, 14, 7, 0, 0));
//         expect(ioMetrics.Label).to.equal('NetworkIn');
//     });

// });
