
export interface IIpcMessage<T, U> {
   readonly name: string;
   readonly createMessage: (...args: any[]) => T;
}
