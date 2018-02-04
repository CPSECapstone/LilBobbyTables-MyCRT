
export enum ChildProgramType { CAPTURE = 'CAPTURE', REPLAY = 'REPLAY' }

/** The status of a capture/replay */
export enum ChildProgramStatus {
   SCHEDULED = 'scheduled',   /** The process has been scheduled for a future time */
   STARTING = 'starting',     /** The process is initializing and will start soon */
   RUNNING = 'running',       /** The process is running normally */
   STOPPING = 'stopping',     /** The process has finished and is wrapping up */
   DONE = 'done',             /** The process has wrapped up and does no longer exist */
   FAILED = 'failed',         /** A fatal error occurred and the process no longer exists */
}

/** Capture/Replay */
export interface IChildProgram {
   type?: ChildProgramType;
   id?: number;
   name?: string;
   start?: Date;
   end?: Date;
   status?: ChildProgramStatus;
}

export interface ICapture extends IChildProgram {
   type: ChildProgramType.CAPTURE;
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
