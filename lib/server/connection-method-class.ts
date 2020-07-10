import { EventEmitter } from "events";
import { IConnectionMethodClass } from "../interfaces/connection-method-class";
import { IConnectionClass } from "../interfaces/connection-class";
import { IMessageMethod } from "../interfaces/message-method";

type TMessageHeaders = {
    [key: string]: string
}

export class ConnectionMethodClass extends EventEmitter implements IConnectionMethodClass {

    constructor ( private readonly _connection: IConnectionClass) {

        super();

        this._connection.on("message", (message) => {
            this.emit("message", message);
        });

        this._connection.on("close", () => {
            this.emit("close");
        });

        this._connection.on("error", (error) => {
            this.emit("error", error);
        });

    }

    get id (): string {
        return this._connection.id;
    }

    get protocol (): string {
        return this._connection.protocol;
    }

    get status (): string {
        return this._connection.status;
    }

    close (): Promise<void> {

        return new Promise( (resolve, reject) => {

            this._connection.close().then( (result) => {
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

            this._connection.send(JSON.stringify(message_method)).then( (result) => {
                resolve(result);
            }).catch( (error) => {
                reject(error);
            });

        });

    }

}