
/** Interface for Capture objects sent/received from the MyCRT service. */
export interface ICapture {
   id?: number;
   name?: string;
   start?: Date;
   end?: Date;
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
   start?: Date;
   end?: Date;
}
