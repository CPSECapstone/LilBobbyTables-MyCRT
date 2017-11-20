
export default class Capture {

   constructor(
      public id: number,
      public name: string,
      public start: Date,
      public end: Date,
   ) {}

   public getDuration(): number {

      const diff: number = this.end.getTime() - this.start.getTime();
      if (diff < 0) {
         throw new Error(`Capture ${this.id} has end time (${this.end}) before start time (${this.start})`);
      }

      return diff;

   }

}
