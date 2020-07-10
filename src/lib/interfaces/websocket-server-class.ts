import { EventEmitter } from "events";
import { IConnectionClass } from "./connection-class";
import { IWebsocketServerInfo } from "./websocket-server-info";

export interface IWebsocketServerClass extends EventEmitter {
    info: IWebsocketServerInfo
    close: () => Promise<void>
    listen (): Promise<void>
    getConnection: (connection_id: string) => IConnectionClass
    getConnectionsList: () => string[];
    send: (message: unknown, connection_id?: string) => Promise<void>
}