import { v4 as uuid } from "uuid";
import { EventEmitter } from "events";
import * as WebSocket from "ws";
import { IConnectionClass } from "../interfaces/connection-class";
import { IConnectionConfig } from "../interfaces/Connection-config";

export class ConnectionClass extends EventEmitter implements IConnectionClass {
    
    private readonly _id: string
    private _status: string
    private _last_pong: number
    private _config: IConnectionConfig
    private _ping_id_interval: ReturnType<typeof setTimeout>

    constructor ( private readonly _ws: WebSocket, config: IConnectionConfig) {

        super();

        this._id = uuid();
        this._status = "open";
        this._last_pong = Date.now();
        

        this._config = {
            heartbeat: 30,
            ttl: 90,
            ...config
        };

        this._ws.on("message", (message) => {
            this.emit("message", message);
        });

        this._ws.on("close", () => {
            this.emit("close");
        });

        this._ws.on("error", (error) => {
            this.emit("error", error);
        });

        this._ws.on("pong", () => {
            this._last_pong = Date.now();
        });

        this._ping();

    }

    get id (): string {
        return this._id;
    }

    get protocol (): string {
        return this._ws.protocol;
    }

    get status (): string {
        return this._status;
    }

    close (): Promise<void> {

        return new Promise( (resolve) => {

            clearTimeout(this._ping_id_interval);

            if (this._status === "open") {

                this._ws.removeAllListeners();
                this._ws.close();

                this._status = "close";

                resolve();

            } else {
                resolve();
            }

        });

    }

    send (message: unknown): Promise<void> {

        return new Promise( (resolve, reject) => {

            if (this._status === "open") {

                this._ws.send(message, {}, () => {
                    resolve();
                });

            } else {
                reject(new Error("Connection not open"));
            }

        });

    }

    terminate (): void {
        clearTimeout(this._ping_id_interval);
        this._ws.removeAllListeners();
        this._ws.terminate();
    }

    _ping (): void {

        clearTimeout(this._ping_id_interval);

        this._ping_id_interval = setTimeout( () => {

            const diff = Date.now() - this._last_pong;

            if (this._status === "open") {
                
                if (diff > this._config.ttl * 1000) {

                    try {
                    
                        this.terminate();

                    } catch (error) {
                        this.emit("error", error);
                    }
    
                    this.emit("error", new Error(`TTL connection ${this._config.ttl} sec is over`));

                } else {
                    this._ws.ping(this._last_pong);
                }

            }

            this._ping();

        }, this._config.heartbeat * 1000);

    }
}