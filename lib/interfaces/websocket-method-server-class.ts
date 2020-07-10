import { EventEmitter } from "events";
import { IWebsocketServerInfo } from "./websocket-server-info";
import { IConnectionMethodClass } from "./connection-method-class";

type TMessageHeaders = {
    [key: string]: string
}

export interface IWebsocketMethodServerClass extends EventEmitter {
    info: IWebsocketServerInfo
    close: () => Promise<void>
    listen (): Promise<void>
    getConnection: (connection_id: string) => IConnectionMethodClass
    getConnectionsList: () => string[];
    send: (method: string, message: unknown, headers: TMessageHeaders, connection_id?: string) => Promise<void>
}