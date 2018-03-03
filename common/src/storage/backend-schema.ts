import { ChildProgramType, IChildProgram } from '../data';

const childProcessTypeToString = (type?: ChildProgramType): string => {
   if (!type) {
      throw new Error(`Bad Child Program Type: ${type}`);
   }
   return type.toLowerCase();
};

/**
 * Get the root prefix for a child program.
 */
const getRootPrefix = (childProgram: IChildProgram): string => {
   return `${childProcessTypeToString(childProgram.type)}${childProgram.id}/`;
};

/**
 * Get the depot prefix for a child program.
 */
const getDepotPrefix = (childProgram: IChildProgram): string => {
   return `${getRootPrefix(childProgram)}depot/`;
};

export enum FragmentType {
   METRICS = 'metrics',
   WORKLOAD = 'workload',
}

export class FragmentTypeSchema {

   public readonly timePattern: RegExp;

   constructor(public readonly fragmentType: FragmentType) {
      this.timePattern = new RegExp(`^${fragmentType}\\-(\\d+)\\.json$`);
   }

   /**
    * Get the storage key for a completed file.
    */
   public getDoneKey(childProgram: IChildProgram): string {
      return `${getRootPrefix(childProgram)}${this.fragmentType}.json`;
   }

   /**
    * Get the storage key for the in-progress file at a given time.
    */
   public getInProgressKey(childProgram: IChildProgram, time: Date): string {
      return `${getRootPrefix(childProgram)}${this.fragmentType}-${time.getTime()}.json`;
   }

   /**
    * Get the storage key for a single sample metrics file at a given time.
    */
   public getSingleSampleKey(childProgram: IChildProgram, time: Date): string {
      return `${getDepotPrefix(childProgram)}${this.fragmentType}-${time.getTime()}.json`;
   }

   public getTimeFromKey(key: string): number {
      const pattern = new RegExp(`^.*${this.fragmentType}\\-(\\d+)\\.json$`);
      const match = key.match(pattern);
      if (!match || match.length < 2) {
         return -1;
      } else {
         return parseInt(match[1]);
      }
   }

}

const typeSchemas: {[key: string]: FragmentTypeSchema} = {
   metrics: new FragmentTypeSchema(FragmentType.METRICS),
   workload: new FragmentTypeSchema(FragmentType.WORKLOAD),
};

const getSchema = (fragmentType: FragmentType): FragmentTypeSchema => {
   const result = typeSchemas[fragmentType.toString()];
   if (!result) {
      throw new Error(`No FragmentTypeScema was provided for ${fragmentType}`);
   }
   return result;
};

export const path = {

   childProcessTypeToString,
   getRootPrefix,
   getDepotPrefix,

   metrics: typeSchemas.metrics,
   workload: typeSchemas.workload,
   getSchema,

};
