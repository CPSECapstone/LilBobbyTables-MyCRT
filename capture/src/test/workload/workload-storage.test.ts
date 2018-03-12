import { expect } from 'chai';
import 'mocha';
import mockito from 'ts-mockito';

import { ICommand, IWorkload} from '@lbt-mycrt/common';
import { StorageBackend } from '@lbt-mycrt/common/dist/storage/backend';

import { WorkloadStorage } from '../../workload/workload-storage';

interface IWorkloadPair {
   first: IWorkload;
   second: IWorkload;
}

describe("WorkloadStorage", () => {

   const workloadStorage = new WorkloadStorage(mockito.mock(StorageBackend));

   const overlapPair: IWorkloadPair = {
      first: {
         start: new Date(100).toString(),
         end: new Date(200).toString(),
         commands: [
            {
               event_time: new Date(110).toString(),
               user_host: "testhost",
               thread_id: 123,
               server_id: 321,
               command_type: "QUERY",
               argument: "AAAA",
            },
            {
               event_time: new Date(190).toString(),
               user_host: "testhost",
               thread_id: 123,
               server_id: 321,
               command_type: "QUERY",
               argument: "BBBB",
            },
         ],
      },
      second: {
         start: new Date(170).toString(),
         end: new Date(250).toString(),
         commands: [
            {
               event_time: new Date(190).toString(),
               user_host: "testhost",
               thread_id: 123,
               server_id: 321,
               command_type: "QUERY",
               argument: "BBBB",
            },
            {
               event_time: new Date(220).toString(),
               user_host: "testhost",
               thread_id: 123,
               server_id: 321,
               command_type: "QUERY",
               argument: "CCCC",
            },
         ],
      },
   };

   const gapPair: IWorkloadPair = {
      first: {
         start: new Date(100).toString(),
         end: new Date(200).toString(),
         commands: [
            {
               event_time: new Date(110).toString(),
               user_host: "testhost",
               thread_id: 123,
               server_id: 321,
               command_type: "QUERY",
               argument: "AAAA",
            },
            {
               event_time: new Date(180).toString(),
               user_host: "testhost",
               thread_id: 123,
               server_id: 321,
               command_type: "QUERY",
               argument: "BBBB",
            },
         ],
      },
      second: {
         start: new Date(400).toString(),
         end: new Date(600).toString(),
         commands: [
            {
               event_time: new Date(420).toString(),
               user_host: "testhost",
               thread_id: 123,
               server_id: 321,
               command_type: "QUERY",
               argument: "CCCC",
            },
            {
               event_time: new Date(550).toString(),
               user_host: "testhost",
               thread_id: 123,
               server_id: 321,
               command_type: "QUERY",
               argument: "DDDD",
            },
         ],
      },
   };

   const mergeAndCheckTimes = (pair: IWorkloadPair): IWorkload => {

      [pair.first, pair.second].forEach((workload) => {
         workload.commands.forEach((command) => {
            command.hash = WorkloadStorage.hash(command);
         });
      });

      const merged = workloadStorage.mergeObjects(pair.first, pair.second);

      expect(merged.start).to.equal(pair.first.start);
      expect(merged.end).to.equal(pair.second.end);

      return merged;
   };

   it("should properly merge overlapping workloads", () => {

      const overlapMerge = mergeAndCheckTimes(overlapPair);
      expect(overlapPair.first.commands[1].hash).to.not.be.undefined;
      expect(overlapPair.first.commands[1].hash).to.equal(overlapPair.second.commands[0].hash);
      expect(overlapMerge.commands.length).to.equal(3);
      expect(overlapMerge.commands[0].hash).to.equal(overlapPair.first.commands[0].hash);
      expect(overlapMerge.commands[1].hash).to.equal(overlapPair.first.commands[1].hash);
      expect(overlapMerge.commands[2].hash).to.equal(overlapPair.second.commands[1].hash);

   });

   it("should properly merge non-overlapping workloads", () => {

      const gapMerge = mergeAndCheckTimes(gapPair);
      expect(gapMerge.commands.length).to.equal(4);
      expect(gapMerge.commands[0].hash).to.equal(gapPair.first.commands[0].hash);
      expect(gapMerge.commands[1].hash).to.equal(gapPair.first.commands[1].hash);
      expect(gapMerge.commands[2].hash).to.equal(gapPair.second.commands[0].hash);
      expect(gapMerge.commands[3].hash).to.equal(gapPair.second.commands[1].hash);

   });

});
