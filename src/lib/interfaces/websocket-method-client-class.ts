import { EventEmitter } from "events";
import { IWebsocketClientInfo } from "./websocket-client-info";

type TMessageHeaders = {
    [key: string]: string
}

export interface IWebsocketMethodClientClass extends EventEmitter {
    readonly status: string
    info: IWebsocketClientInfo
    connect: () => Promise<void>
    close: () => Promise<void>
    send: (method: string, message: unknown, headers: TMessageHeaders) => Promise<void>
    terminate: () => void
}