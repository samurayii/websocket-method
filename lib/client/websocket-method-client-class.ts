import { EventEmitter } from "events";
import { IWebsocketClientConfig } from "../interfaces/websocket-client-config";
import { IWebsocketClientInfo } from "../interfaces/websocket-client-info";
import { IWebsocketMethodClientClass } from "../interfaces/websocket-method-client-class";
import { IWebsocketClientClass } from "../interfaces/websocket-client-class";
import { WebsocketClientClass } from "./websocket-client-class";
import * as message_schema from "../message_schema.json";
import * as Ajv from "ajv";
import { IMessageMethod } from "../interfaces/message-method";

type TMessageHeaders = {
    [key: string]: string
}

export class WebsocketMethodClientClass extends EventEmitter implements IWebsocketMethodClientClass {

    private _client: IWebsocketClientClass

    constructor (config: IWebsocketClientConfig) {
        super();
        this._client = new WebsocketClientClass(config);

        this._client.on("open", () => {
            this.emit("open");
        });

        this._client.on("close", (code, reason) => {
            this.emit("close", code, reason);
        });

        this._client.on("reconnecting", () => {
            this.emit("reconnecting");
        });

        this._client.on("error", (error) => {
            this.emit("error", error);
        });

        const ajv = new Ajv();
        const validate = ajv.compile(message_schema);

        this._client.on("message", (message) => {

            try {

                const message_json: IMessageMethod = JSON.parse(message);
                const valid = validate(message_json);

                if (valid) {

                    const body = message_json.body;
                    const headers = message_json.headers;
                    const method = message_json.method;

                    this.emit(`method:${method}`, body, headers);

                }

            } catch (error) {
                this.emit("error", error);
            }

        });
        
    }

    get status (): string {
        return this._client.status;
    }

    connect (): Promise<void> {

        return new Promise( (resolve, reject) => {

            this._client.connect().then( (result) => {
                resolve(result);
            }).catch( (error) => {
                reject(error);
            });

        });

    }

    close (): Promise<void> {

        return new Promise( (resolve, reject) => {

            this._client.close().then( (result) => {
                resolve(result);
            }).catch( (error) => {
                reject(error);
            });

        });

    }

    send (method: string, message: unknown, headers: TMessageHeaders = {}): Promise<void> {

        return new Promise( (resolve, reject) => {

            const message_method: IMessageMethod ={
                method: method,
                headers: headers,
                body: message
            };

            this._client.send(JSON.stringify(message_method)).then( (result) => {
                resolve(result);
            }).catch( (error) => {
                reject(error);
            });

        });

    }

    terminate (): void { 
        this._client.terminate();
    }

    get info (): IWebsocketClientInfo {
        return this._client.info;
    }

}