import { EventEmitter } from "events";
import * as WebSocket from "ws";
import { convertMaxPayload } from "../convert-max-payload";
import { IWebsocketClientClass } from "../interfaces/websocket-client-class";
import { IWebsocketClientConfig } from "../interfaces/websocket-client-config";
import { IWebsocketClientInfo } from "../interfaces/websocket-client-info";

export class WebsocketClientClass extends EventEmitter implements IWebsocketClientClass {

    private _status: string
    private _last_pong: number
    private _ws_client: WebSocket
    private _ping_id_interval: ReturnType<typeof setTimeout>
    private _reconnect_id_interval: ReturnType<typeof setTimeout>
    private readonly _config: IWebsocketClientConfig

    constructor (config: IWebsocketClientConfig) {

        super();

        this._config = {
            url: "ws://localhost:8080/websocket",
            reconnect_interval: 10,
            heartbeat: 30,
            ttl: 90,
            max_payload: "100kb",
            headers: {},
            auth: {},
            reject_unauthorized: true,
            ...config
        };

        if (this._config.auth.login !== undefined && this._config.auth.password !== undefined) {
            this._config.headers["Authorization"] = `Basic ${Buffer.from(`${this._config.auth.login}:${this._config.auth.password}`).toString("base64")}`;
        }

        if (this._config.auth.token !== undefined) {
            this._config.headers["Authorization"] = `Bearer ${this._config.auth.token}`;
        }

        this._status = "close";
        this._last_pong = 0;

    }

    get status (): string {
        return this._status;
    }

    _connect (): Promise<void> {

        return new Promise( (resolve, reject) => {

            this._status = "connecting";
    
            this._ws_client = new WebSocket(this._config.url, [], {
                headers: this._config.headers,
                maxPayload: convertMaxPayload(this._config.max_payload),
                rejectUnauthorized: this._config.reject_unauthorized
            });

            this._ws_client.once("open", () => {

                this._last_pong = Date.now();
                this._status = "open";

                this._ws_client.removeAllListeners("error");

                this._ws_client.on("error", (error) => {
                    this._reconnect();
                    this.emit("error", error);
                });

                this._ws_client.on("message", (message) => {
                    this.emit("message", message);
                });
    
                this._ws_client.on("pong", () => {
                    this._last_pong = Date.now();
                });

                this._ws_client.on("close", (code, reason) => {
                    this._reconnect();
                    this.emit("close", code, reason);
                });

                this._ping();

                this.emit("open");

                resolve();

            });

            this._ws_client.once("error", (error) => {
                this._status = "close";
                reject(error);
            });

        });

    }

    connect (): Promise<void> {

        return new Promise( (resolve, reject) => {

            if (this._status === "close") {

                this._connect().then( () => {
                    resolve();
                }).catch( (error) => {
                    reject(error);
                });

            } else {
                resolve();
            }

        });

    }

    close (): Promise<void> {

        return new Promise( (resolve) => {

            clearTimeout(this._ping_id_interval);
            clearTimeout(this._reconnect_id_interval);

            this._ws_client.removeAllListeners();

            if (this._status === "open" || this._status === "reconnecting") {

                this._ws_client.close();

                this._status = "close";

                resolve();

            } else {
                this._status = "close";
                resolve();
            }

        });

    }

    send (message: unknown): Promise<void> {

        return new Promise( (resolve, reject) => {

            if (this._status === "open") {

                this._ws_client.send(message, {}, () => {
                    resolve();
                });

            } else {
                reject(new Error("Connection not open"));
            }

        });

    }

    _reconnect(): void {

        this._status = "reconnecting";

        this.emit("reconnecting");

        clearTimeout(this._reconnect_id_interval);

        this._reconnect_id_interval = setTimeout( () => {

            if (this._status === "reconnecting") {

                this._connect().catch( () => {
                    this._reconnect();
                });

            }

        }, this._config.reconnect_interval * 1000);

    }

    _ping (): void {

        clearTimeout(this._ping_id_interval);

        this._ping_id_interval = setTimeout( () => {

            const diff = Date.now() - this._last_pong;

            if (this._status === "open" || this._status === "connecting") {
                
                if (diff > this._config.ttl * 1000) {

                    try {

                        this.terminate();

                    } catch (error) {
                        this.emit("error", error);
                    }

                    this._reconnect();
    
                    this.emit("error", new Error(`TTL connection ${this._config.ttl} sec is over`));

                } else {
                    this._ws_client.ping(this._last_pong);
                }

            }

            this._ping();

        }, this._config.heartbeat * 1000);

    }

    terminate (): void {
        clearTimeout(this._ping_id_interval);
        clearTimeout(this._reconnect_id_interval);
        this._ws_client.removeAllListeners();  
        this._ws_client.terminate();
    }

    get info (): IWebsocketClientInfo {
        return {
            url: this._config.url,
            reconnect_interval: this._config.reconnect_interval,
            heartbeat: this._config.heartbeat,
            ttl: this._config.ttl,
            max_payload: this._config.max_payload,
            status: this._status,
            last_pong: this._last_pong
        };
    }

}