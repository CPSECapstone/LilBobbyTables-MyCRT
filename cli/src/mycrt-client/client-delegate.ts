
export type MessageLogger = (msg: string) => void;

/**
 * Delegate for the MyCrtClient class.
 */
export interface IMyCrtClientDelegate {

   /**
    * A function used to perform http requests.
    * Be careful what is passed here, 'any' is used because of the
    * differences in the window.fetch and node-fetch implementations.
    */
   fetch: any;

   /** An error callback when a request fails. */
   onError: (reason: any) => void;

   /** Logging backend used within the client. */
   logger: {
      silly: MessageLogger;
      debug: MessageLogger;
      info: MessageLogger;
      warn: MessageLogger;
      error: MessageLogger;
   };

}
