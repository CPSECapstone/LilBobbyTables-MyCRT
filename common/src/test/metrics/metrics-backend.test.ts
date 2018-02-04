import { assert, expect } from 'chai';
import 'mocha';
import mockito from 'ts-mockito';

import { ChildProgramStatus, ChildProgramType, IChildProgram, IMetric, IMetricsList, MetricType } from '../../data';
import { MetricsBackend } from '../../metrics/metrics-backend';
import { StorageBackend } from '../../storage/backend';
import { LocalBackend } from '../../storage/local-backend';

describe("MetricsBackend", () => {

   const c1: IChildProgram = {
      id: 0,
      name: "c1",
      type: ChildProgramType.CAPTURE,
      status: ChildProgramStatus.DEAD,
      start: new Date(),
      end: new Date(),
   };

   const c2: IChildProgram = {
      id: 1,
      name: "c2",
      type: ChildProgramType.CAPTURE,
      status: ChildProgramStatus.DEAD,
      start: new Date(),
      end: new Date(),
   };

   const dummyMetrics: IMetricsList[] = [
      {
         label: "NetworkIn",
         type: MetricType.IO,
         displayName: "IO",
         live: false,
         dataPoints: [],
      },
      {
         label: "FreeableMemory",
         type: MetricType.MEMORY,
         displayName: "MEMORY",
         live: false,
         dataPoints: [],
      },
      {
         label: "CPUUtilization",
         type: MetricType.CPU,
         displayName: "CPU",
         live: false,
         dataPoints: [],
      },
   ];

   let backend: StorageBackend;
   let metrics: MetricsBackend;

   before(() => {
      backend = mockito.mock(LocalBackend);

      const key = MetricsBackend.getDoneMetricsKey(c1);
      mockito.when(backend.readJson<IMetricsList[]>(key)).thenReturn(new Promise((resolve, reject) => {
         resolve(dummyMetrics);
      }));

      metrics = new MetricsBackend(mockito.instance(backend));
   });

   it("should read capture CPU metrics", async () => {
      const result = await metrics.readMetrics(c1, MetricType.CPU) as IMetricsList;
      expect(result.type).to.equal(MetricType.CPU);
      expect(result.label).to.equal("CPUUtilization");
   });

   it("should read capture IO metrics", async () => {
      const result = await metrics.readMetrics(c1, MetricType.IO) as IMetricsList;
      expect(result.type).to.equal(MetricType.IO);
      expect(result.label).to.equal("NetworkIn");
   });

   it("should read capture Memory metrics", async () => {
      const result = await metrics.readMetrics(c1, MetricType.MEMORY) as IMetricsList;
      expect(result.type).to.equal(MetricType.MEMORY);
      expect(result.label).to.equal("FreeableMemory");
   });

   it("should read all capture metrics", async () => {
      const result = await metrics.readMetrics(c1) as IMetricsList[];
      expect(result.length).to.equal(3);
      const cpu = MetricsBackend.specificMetricFromList(result, MetricType.CPU);
      const io = MetricsBackend.specificMetricFromList(result, MetricType.IO);
      const memory = MetricsBackend.specificMetricFromList(result, MetricType.MEMORY);
      expect(cpu.type).to.equal(MetricType.CPU);
      expect(io.type).to.equal(MetricType.IO);
      expect(memory.type).to.equal(MetricType.MEMORY);
   });

});
