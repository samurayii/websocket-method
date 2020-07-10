import { EventEmitter } from "events";

type TMessageHeaders = {
    [key: string]: string
}

export interface IConnectionMethodClass extends EventEmitter  {
    readonly id: string
    readonly protocol: string
    readonly status: string
    close: () => Promise<void>
    send: (method: string, message: unknown, headers: TMessageHeaders) => Promise<void>
}