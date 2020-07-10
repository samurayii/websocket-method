import { WebsocketServerClass } from "./websocket-server-class";
import { IWebsocketServerConfig } from "../interfaces/websocket-server-config";
import { EventEmitter } from "events";
import { IWebsocketServerClass } from "../interfaces/websocket-server-class";
import { IWebsocketServerInfo } from "../interfaces/websocket-server-info";
import { IWebsocketMethodServerClass } from "../interfaces/websocket-method-server-class";
import { IConnectionMethodClass } from "../interfaces/connection-method-class";
import { IConnectionClass } from "../interfaces/connection-class";
import { ConnectionMethodClass } from "./connection-method-class";
import * as message_schema from "../message_schema.json";
import * as Ajv from "ajv";
import { IMessageMethod } from "../interfaces/message-method";

type TMessageHeaders = {
    [key: string]: string
}

export class WebsocketMethodServerClass extends EventEmitter implements IWebsocketMethodServerClass {

    private _server: IWebsocketServerClass
    private _connections_list: {
        [key: string]: IConnectionMethodClass
    }
    
    constructor (config: IWebsocketServerConfig) {

        super();

        this._server = new WebsocketServerClass(config);
        this._connections_list = {};

        const ajv = new Ajv();
        const validate = ajv.compile(message_schema);

        this._server.on("message", (message, connection: IConnectionClass) => {

            try {

                const message_json: IMessageMethod = JSON.parse(message);
                const valid = validate(message_json);

                if (valid) {

                    const body = message_json.body;
                    const headers = message_json.headers;
                    const method = message_json.method;
                    const connection_method = this.getConnection(connection.id);

                    this.emit(`method:${method}`, body, headers, connection_method);

                }

            } catch (error) {
                this.emit("error", error);
            }

        });

        this._server.on("close", (connection: IConnectionClass) => {
            const id = connection.id;
            if (this._connections_list[id] !== undefined) {
                const connection_method: IConnectionMethodClass = this._connections_list[id];
                delete this._connections_list[id];
                this.emit("close", connection_method);
            }
        });

        this._server.on("open", (connection: IConnectionClass) => {
            const connection_method: IConnectionMethodClass = new ConnectionMethodClass(connection);
            this._connections_list[connection_method.id] = connection_method;
            this.emit("open", connection_method);
        });

        this._server.on("authorization", (auth_type: string, auth_string: string, callback) => {
            this.emit("authorization", auth_type, auth_string, callback);
        });

    }

    listen (): Promise<void> {

        return new Promise( (resolve, reject) => {

            this._server.listen().then( (result) => {
                resolve(result);
            }).catch( (error) => {
                reject(error);
            });

        });

    }

    close (): Promise<void> {

        return new Promise( (resolve, reject) => {

            this._server.close().then( (result) => {
                resolve(result);
            }).catch( (error) => {
                reject(error);
            });

        });

    }

    getConnectionsList (): string[] {
        return Object.keys(this._connections_list);
    }

    getConnection (connection_id: string): IConnectionMethodClass {
        if (this._connections_list[connection_id] === undefined) {
            return;
        }
        return this._connections_list[connection_id];
    }

    send (method: string, message: unknown, headers: TMessageHeaders, connection_id?: string): Promise<void> {

        return new Promise( (resolve, reject) => {
         
            if (connection_id === undefined) {

                if (Object.keys(this._connections_list).length > 0) {

                    const connections_sender = [];
    
                    for (const connection_id in this._connections_list) {
                        const connection = this._connections_list[connection_id];
                        connections_sender.push(connection.send(method, message, headers));
                    }
   
                    Promise.all(connections_sender).then( () => {
                        resolve();
                    }).catch( (error) => {
                        reject(error);
                    });
    
                } else {
                    resolve();
                }

            } else {

                const connection: IConnectionMethodClass = this.getConnection(connection_id);

                if (connection === undefined) {
                    resolve();
                } else {

                    connection.send(method, message, headers).then( () => {
                        resolve();
                    }).catch( (error) => {
                        reject(error);
                    });
                }

            }

        });

    }

    get info (): IWebsocketServerInfo {
        return this._server.info;
    }
}