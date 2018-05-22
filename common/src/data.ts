export interface ISession {
   sessionToken?: string;
   loginTime?: number | null;
   lastTokenCheck?: number | null;
}

export interface IUser extends ISession {
   id?: number;
   email?: string;
   passwordHash?: string;
   isAdmin?: boolean;
}

export interface IEnvironmentUser {
   id?: number;
   environmentId?: number;
   userId?: number;
   isAdmin?: boolean;
   inviteCode?: string;
   accepted?: boolean;
   createdAt?: number;
   acceptedAt?: number;
   username?: string;
}

export enum ChildProgramType { CAPTURE = 'CAPTURE', REPLAY = 'REPLAY', MIMIC = 'MIMIC' }

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
   ownerId?: number;
   username?: string;
   envId?: number;
   name?: string;
   start?: Date;
   end?: Date;
   reason?: string;
   scheduledStart?: Date;
   scheduledEnd?: Date;
   status?: ChildProgramStatus;
}

export interface ICapture extends IChildProgram {
   type: ChildProgramType.CAPTURE;
   // envId?: number;
}

export interface IReplay extends IChildProgram {
   type: ChildProgramType.REPLAY;
   captureId?: number;
   dbId?: number;
   envId?: number;
}

export interface IReplayFull extends IChildProgram {
   type: ChildProgramType.REPLAY;
   captureId?: number;
   dbName: string;
   host: string;
   user: string;
   pass: string;
   instance: string;
   parameterGroup: string;
}

export interface IMimic extends IChildProgram {
   type: ChildProgramType.MIMIC;
   replays?: IReplay[];
}

/** Interface for Environment objects sent/received from the MyCRT service. */
export interface IEnvironment {
   id?: number;
   name?: string;
   ownerId?: number;
   awsKeysId?: number;
   dbId?: number;
   s3Id?: number;
   username?: string;
}

export interface IEnvironmentFull {
   id?: number;
   envName: string;
   ownerId?: number;
   username: string;
   keysId?: number;
   keysName: string;
   accessKey: string;
   secretKey: string;
   region: string;
   dbName: string;
   host: string;
   user: string;
   pass: string;
   instance: string;
   parameterGroup: string;
   bucket: string;
   prefix: string;
}

export interface IAwsKeys {
   id?: number;
   accessKey: string;
   secretKey: string;
   region: string;
   name?: string;
   userId?: number;
}

/** Database Connection */
export interface IDbReference {
   id?: number;
   name?: string;
   host?: string;
   user?: string;
   pass?: string;
   instance?: string;
   parameterGroup?: string;
}

/** S3 Reference */
export interface IS3Reference {
   id?: number;
   bucket?: string;
   prefix?: string;
}

/** Commands in a Workload */
export interface ICommand {

   // fields obtained from mysql
   event_time: string;
   user_host: string;
   thread_id: number;
   server_id: number;
   command_type: string;
   argument: string;

   // used in workload reading and storage
   hash?: string;
}

/** Workload */
export interface IWorkload {
   start: string;
   end: string;
   commands: ICommand[];
}

/** The type of data */
export enum MetricType { CPU = "CPU UTILIZATION", WRITE = "WRITE IOPS", READ = "READ IOPS", MEMORY = "FREEABLE MEMORY",
                         FREESTORAGE = "FREE STORAGE", READTHROUGHPUT = "READ THROUGHPUT",
                         WRITETHROUGHPUT = "WRITE THROUGHPUT",
                       }

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
   type: string;
   displayName?: string;
   complete?: boolean;
   dataPoints: IMetric[];
}

export const ByteToMegabyte = 0.00000095367432;
