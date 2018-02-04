
export enum ChildProgramType { CAPTURE = 'CAPTURE', REPLAY = 'REPLAY' }

export enum ChildProgramStatus { DEAD = 'dead', LIVE = 'live', STARTING = 'starting'}

/** Capture/Replay */
export interface IChildProgram {
   type?: ChildProgramType;
   id?: number;
   name?: string;
   start?: Date;
   end?: Date;
   status?: ChildProgramStatus;
}

export interface IReplay extends IChildProgram {
   type: ChildProgramType.REPLAY;
   captureId?: number;
}

/** Interface for Environment objects sent/received from the MyCRT service. */
export interface IEnvironment {
   id?: number;
   name?: string;
   s3Bucket?: string;
}

/** The type of data */
export enum MetricType { CPU = "CPU", IO = "IO", MEMORY = "MEMORY" }

/** Interface for a single metric measurement */
export interface IMetric {
   Timestamp: string;
   Maximum: number;
   Unit: string;
   [key: string]: any;
}

/** Interface for a list of a IMetrics gathered at different timestamps for a capture/replay */
export interface IMetricsList {
   label: string;
   type: MetricType;
   displayName: string;
   live: boolean;
   dataPoints: IMetric[];
}
