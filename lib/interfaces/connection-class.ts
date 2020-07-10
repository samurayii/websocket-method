import { EventEmitter } from "events";

export interface IConnectionClass extends EventEmitter  {
    readonly id: string
    readonly protocol: string
    readonly status: string
    close: () => Promise<void>
    send: (message: unknown) => Promise<void>
    terminate: () => void
}