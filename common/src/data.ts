
export enum ChildProgramType { CAPTURE = 'CAPTURE', REPLAY = 'REPLAY' }

/** The status of a capture/replay */
export enum ChildProgramStatus {
   SCHEDULED = 'SCHEDULED',   /** The process has been scheduled for a future time */
   STARTED = 'STARTED',       /** The process is being setup by MyCRT, but has not started yet */
   STARTING = 'STARTING',     /** The process is initializing and will start soon */
   RUNNING = 'RUNNING',       /** The process is running normally */
   STOPPING = 'STOPPING',     /** The process has finished and is wrapping up */
   DONE = 'DONE',             /** The process has wrapped up and does no longer exist */
   FAILED = 'FAILED',         /** A fatal error occurred and the process no longer exists */
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
   iamId?: number;
   dbId?: number;
   s3Id?: number;
}

export interface IEnvironmentFull {
   id: number;
   envName: string;
   accessKey: string;
   secretKey: string;
   region: string;
   dbName: string;
   host: string;
   user: string;
   pass: string;
   parameterGroup: string;
   bucket: string;
}

/** IAM Profile */
export interface IIamReference {
   id?: number;
   accessKey?: string;
   secretKey?: string;
   region?: string;
}

/** Database Connection */
export interface IDbReference {
   id?: number;
   name?: string;
   host?: string;
   user?: string;
   pass?: string;
   parameterGroup?: string;
}

/** S3 Reference */
export interface IS3Reference {
   id?: number;
   bucket?: string;
}

/** The type of data */
export enum MetricType { CPU = "CPU", WRITE = "WRITE", READ = "READ", MEMORY = "MEMORY" }

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
   displayName?: string;
   complete?: boolean;
   dataPoints: IMetric[];
}
