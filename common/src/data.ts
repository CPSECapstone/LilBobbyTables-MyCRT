
export enum ChildProgramType { CAPTURE = 'CAPTURE', REPLAY = 'REPLAY' }

/** Interface for Capture objects sent/received from the MyCRT service. */
export interface ICapture {
   id?: number;
   name?: string;
   start?: string;
   end?: string | null;
}

/** Interface for Environment objects sent/received from the MyCRT service. */
export interface IEnvironment {
   id?: number;
   name?: string;
}

/** Interface for Replay objects sent/received from the MyCRT service. */
export interface IReplay {
   id?: number;
   name?: string;
   start?: string;
   end?: string;
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
   dataPoints: [IMetric];
}
