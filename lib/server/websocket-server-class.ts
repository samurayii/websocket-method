import { EventEmitter } from "events";
import * as WebSocket from "ws";
import * as fs from "fs";
import * as path from "path";
import * as http from "http";
import * as https from "https";
import { ConnectionClass } from "./connection-class";
import { convertMaxPayload } from "../convert-max-payload";
import { IConnectionClass } from "../interfaces/connection-class";
import { IWebsocketServerConfig } from "../interfaces/websocket-server-config";
import { IWebsocketServerClass } from "../interfaces/websocket-server-class";
import { IWebsocketServerInfo } from "../interfaces/websocket-server-info";

export class WebsocketServerClass extends EventEmitter implements IWebsocketServerClass {

    private _listen_flag: boolean
    private _connections_list: {
        [key: string]: IConnectionClass
    }
    private _ws_server: WebSocket.Server
    private _http_server: http.Server
    private _server: http.Server
    private _config: IWebsocketServerConfig

    constructor (config: IWebsocketServerConfig) {

        super();

        this._listen_flag = false;
        this._connections_list = {};

        this._config = {
            host: "*",
            port: 8080,
            prefix: "/",
            protocol: "ws",
            heartbeat: 30,
            ttl: 90,
            max_payload: "100kb",
            cert: "cert.pem",
            key: "key.pem",
            auth: false,
            ...config
        };

        const server_settings = {
            maxPayload: convertMaxPayload(this._config.max_payload),
            perMessageDeflate: false,
            clientTracking: true,
            noServer: true,
            path: this._config.prefix
        };

        if (this._config.protocol === "wss") {

            const key_full_path = path.resolve(process.cwd(), this._config.key);
            const cert_full_path = path.resolve(process.cwd(), this._config.cert);

            if (!fs.existsSync(cert_full_path)) {
                throw new Error(`Cert file ${cert_full_path} not found`);
            }

            if (!fs.existsSync(key_full_path)) {
                throw new Error(`Key file ${key_full_path} not found`);
            }

            this._http_server = https.createServer({
                cert: fs.readFileSync(cert_full_path),
                key: fs.readFileSync(key_full_path)
            });

        } else {
            this._http_server = http.createServer();
        }

        this._ws_server = new WebSocket.Server(server_settings);

    }

    listen (): Promise<void> {

        return new Promise( (resolve, reject) => {

            if (this._listen_flag === false) {

                this._listen_flag = true;

                let host;

                if (this._config.host !== "*" && this._config.host !== "0.0.0.0") {
                    host = this._config.host;
                }
    
                this._server = this._http_server.listen(this._config.port, host, () => {

                    this._server.removeAllListeners("error");

                    this._http_server.removeAllListeners("error");
                    this._http_server.removeAllListeners("upgrade");
                    this._ws_server.removeAllListeners("connection");

                    this._ws_server.on("connection", (ws) => {

                        const connection: IConnectionClass = new ConnectionClass(ws, {
                            heartbeat: this._config.heartbeat,
                            ttl: this._config.ttl
                        });

                        this._connections_list[connection.id] = connection;
                        
                        connection.on("message", (message) => {
                            this.emit("message", message, connection);
                        });

                        connection.on("close", () => {
                            delete this._connections_list[connection.id];
                            connection.terminate();
                            this.emit("close", connection);
                        });

                        connection.on("error", () => {
                            delete this._connections_list[connection.id];
                            connection.terminate();
                            this.emit("close", connection);
                        });

                        this.emit("open", connection);

                    });
            
                    this._http_server.on("upgrade", (request, socket, head) => {
            
                        if (this._config.auth === true) {
            
                            if (request.headers.authorization === undefined) {
                                socket.destroy();
                                return;
                            }
            
                            let type_auth = request.headers.authorization.match(/(^Basic|^Bearer)/gi);
            
                            if (!type_auth) {
                                socket.destroy();
                                return;
                            } else {
                                type_auth = type_auth[0];
                            }
            
                            const auth_string = request.headers.authorization.replace(/(^Basic|^Bearer)/gi, "").trim();
            
                            this.emit("authorization", type_auth, auth_string, (result: boolean) => {
            
                                if (result === true) {
                                    this._ws_server.handleUpgrade(request, socket, head, (ws) => {
                                        this._ws_server.emit("connection", ws, request);
                                    });
                                } else {
                                    socket.destroy();
                                    return;
                                }
            
                            });
            
                        } else {
                            this._ws_server.handleUpgrade(request, socket, head, (ws) => {
                                this._ws_server.emit("connection", ws, request);
                            });
                        }
            
                    });

                    resolve();

                });

                this._server.once("error", (error) => {
                    reject(error);
                });
    
            } else {
                resolve();
            }

        });

    }

    close (): Promise<void> {

        return new Promise( (resolve, reject) => {

            if (this._listen_flag === true) {

                this._listen_flag = false;

                const connections_closer = [];

                for (const connection_id in this._connections_list) {

                    const connection = this._connections_list[connection_id];
                    connections_closer.push(connection.close());
                }

                this._connections_list = {};

                Promise.all(connections_closer).finally( () => {

                    this._server.once("error", (error) => {
                        reject(error);
                    });

                    this._server.close(() => {
                        this._server.removeAllListeners("error");
                        resolve();
                    });

                });

            } else {
                resolve();
            }

        });

    }
    
    send (message: unknown, connection_id?: string): Promise<void> {

        return new Promise( (resolve, reject) => {

            if (connection_id === undefined) {

                if (Object.keys(this._connections_list).length > 0) {

                    const connections_sender = [];
    
                    for (const connection_id in this._connections_list) {
                        const connection = this._connections_list[connection_id];
                        connections_sender.push(connection.send(message));
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

                const connection: IConnectionClass = this.getConnection(connection_id);

                if (connection === undefined) {
                    resolve();
                } else {

                    connection.send(message).then( () => {
                        resolve();
                    }).catch( (error) => {
                        reject(error);
                    });
                }

            }

        });

    }

    getConnection (connection_id: string): IConnectionClass {
        if (this._connections_list[connection_id] === undefined) {
            return;
        }
        return this._connections_list[connection_id];
    }

    getConnectionsList (): string[] {
        return Object.keys(this._connections_list);
    }

    get info (): IWebsocketServerInfo {
        return {
            host: this._config.host,
            port: this._config.port,
            prefix: this._config.prefix,
            protocol: this._config.protocol,
            heartbeat: this._config.heartbeat,
            ttl: this._config.ttl,
            max_payload: this._config.max_payload,
            auth: this._config.auth,
            connections: Object.keys(this._connections_list).length
        };
    }

}