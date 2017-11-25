
export type MessageLogger = (msg: string) => void;

export interface IMyCrtClientDelegate {

   fetch: any;

   onError: (reason: any) => void;

   logger: {
      silly: MessageLogger;
      debug: MessageLogger;
      info: MessageLogger;
      warn: MessageLogger;
      error: MessageLogger;
   };

}
