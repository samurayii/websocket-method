import { EventEmitter } from "events";
import { IWebsocketClientInfo } from "./websocket-client-info";

export interface IWebsocketClientClass extends EventEmitter {
    readonly status: string
    info: IWebsocketClientInfo
    connect: () => Promise<void>
    close: () => Promise<void>
    send: (message: unknown) => Promise<void>
    terminate: () => void
}