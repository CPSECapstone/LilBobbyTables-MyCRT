import { assert, expect } from 'chai';
import 'mocha';
import mockito from 'ts-mockito';

import { ChildProgramStatus, ChildProgramType, IChildProgram, IMetric, IMetricsList, MetricType } from '../../data';
import { MetricsStorage } from '../../metrics/metrics-storage';
import { StorageBackend } from '../../storage/backend';
import { LocalBackend } from '../../storage/local-backend';

describe("MetricsBackend", () => {

   const c1: IChildProgram = {
      id: 0,
      name: "c1",
      type: ChildProgramType.CAPTURE,
      status: ChildProgramStatus.DONE,
      start: new Date(),
      end: new Date(),
   };

   const c2: IChildProgram = {
      id: 1,
      name: "c2",
      type: ChildProgramType.CAPTURE,
      status: ChildProgramStatus.DONE,
      start: new Date(),
      end: new Date(),
   };

   const dummyMetrics: IMetricsList[] = [
      {
         label: "ReadLatency",
         type: MetricType.READ,
         displayName: "READ",
         dataPoints: [],
      },
      {
        label: "WriteLatency",
        type: MetricType.WRITE,
        displayName: "WRITE",
        dataPoints: [],
      },
      {
         label: "FreeableMemory",
         type: MetricType.MEMORY,
         displayName: "MEMORY",
         dataPoints: [],
      },
      {
         label: "CPUUtilization",
         type: MetricType.CPU,
         displayName: "CPU",
         dataPoints: [],
      },
   ];

   let backend: StorageBackend;
   let metrics: MetricsStorage;

   before(() => {
      backend = mockito.mock(LocalBackend);

      const key = MetricsStorage.getDoneMetricsKey(c1);
      mockito.when(backend.exists(key)).thenReturn(new Promise((resolve, reject) => {
         resolve(true);
      }));
      mockito.when(backend.readJson<IMetricsList[]>(key)).thenReturn(new Promise((resolve, reject) => {
         resolve(dummyMetrics);
      }));

      metrics = new MetricsStorage(mockito.instance(backend));
   });

   it("should read capture CPU metrics", async () => {
      const result = await metrics.readMetrics(c1, MetricType.CPU) as IMetricsList;
      expect(result.type).to.equal(MetricType.CPU);
      expect(result.label).to.equal("CPUUtilization");
   });

   it("should read capture read IO metrics", async () => {
      const result = await metrics.readMetrics(c1, MetricType.READ) as IMetricsList;
      expect(result.type).to.equal(MetricType.READ);
      expect(result.label).to.equal("ReadLatency");
   });

   it("should read capture write IO metrics", async () => {
      const result = await metrics.readMetrics(c1, MetricType.WRITE) as IMetricsList;
      expect(result.type).to.equal(MetricType.WRITE);
      expect(result.label).to.equal("WriteLatency");
   });

   it("should read capture Memory metrics", async () => {
      const result = await metrics.readMetrics(c1, MetricType.MEMORY) as IMetricsList;
      expect(result.type).to.equal(MetricType.MEMORY);
      expect(result.label).to.equal("FreeableMemory");
   });

   it("should read all capture metrics", async () => {
      const result = await metrics.readMetrics(c1) as IMetricsList[];
      expect(result.length).to.equal(4);
      const cpu = MetricsStorage.getSpecificMetricFromList(result, MetricType.CPU);
      const read = MetricsStorage.getSpecificMetricFromList(result, MetricType.READ);
      const write = MetricsStorage.getSpecificMetricFromList(result, MetricType.WRITE);
      const memory = MetricsStorage.getSpecificMetricFromList(result, MetricType.MEMORY);
      expect(cpu.type).to.equal(MetricType.CPU);
      expect(read.type).to.equal(MetricType.READ);
      expect(write.type).to.equal(MetricType.WRITE);
      expect(memory.type).to.equal(MetricType.MEMORY);
   });

});
