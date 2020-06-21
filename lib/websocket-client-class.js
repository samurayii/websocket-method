const EventEmitter = require('events');
const WebSocket = require('ws');
const convertMaxPayload = require('./convert-max-payload');

module.exports = class WebsocketClientClass extends EventEmitter {

    constructor (config) {

        super();

        this._config = {
            url: "ws://localhost:8080/websocket",
            reconnect_interval: 10,
            heartbeat: 30,
            ttl: 90,
            max_payload: "100kb",
            headers: {},
            auth: {},
            ...config
        }

        if (this._config.auth.login && this._config.auth.password) {
            this._config.headers["Authorization"] = `Basic ${Buffer.from(`${this._config.auth.login}:${this._config.auth.password}`).toString('base64')}`
        }

        if (this._config.auth.token) {
            this._config.headers["Authorization"] = `Bearer ${this._config.auth.token}`;
        }

        this._config.max_payload = convertMaxPayload(this._config.max_payload);

        this._status = 'closed';
        this._last_pong = 0;

    }

    get status () {
        return this._status;
    }

    _connect () {

        return new Promise( (resolve, reject) => {

            this._status = 'connecting';
    
            this._ws_client = new WebSocket(this._config.url, [], {
                headers: this._config.headers
            });

            this._ws_client.once('open', () => {

                this._last_pong = Date.now();
                this._status = 'open';

                this._ws_client.removeAllListeners('error');

                this._ws_client.on('error', (error) => {
                    this.emit('error', error);
                    this._reconnect();
                });

                this._ws_client.on('message', (message) => {
                    this.emit('message', message);
                });
    
                this._ws_client.on('pong', () => {
                    this._last_pong = Date.now();
                });

                this._ws_client.on('close', (code, reason) => {
                    this.emit('close', code, reason);
                    this._reconnect();
                });

                this._ping();

                this.emit('open');

                resolve();

            });

            this._ws_client.once('error', (error) => {
                this._status = 'closed';
                reject(error);
            });

        });

    }

    connect () {

        return new Promise( (resolve, reject) => {

            if (this._status === 'closed') {

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

    close () {

        return new Promise( (resolve) => {

            clearTimeout(this._ping_id_interval);
            clearTimeout(this._reconnect_id_interval);

            this._ws_client.removeAllListeners('error');
            this._ws_client.removeAllListeners('close');

            if (this._status === 'open' || this._status === 'reconnecting') {

                this._ws_client.close();

                this._status = 'closed';

                resolve();

            } else {
                this._status = 'closed';
                resolve();
            }

        });

    }

    send (message) {

        return new Promise( (resolve, reject) => {

            if (this._status === 'open') {

                this._ws_client.send(message, {}, () => {
                    resolve();
                });

            } else {
                reject(new Error('Connection not open'));
            }

        });

    }

    _reconnect() {

        this._status = 'reconnecting';

        this.emit('reconnecting');

        this._reconnect_id_interval = setTimeout( () => {

            if (this._status === 'reconnecting') {

                this._connect().catch( () => {
                    this._reconnect();
                });

            }

        }, this._config.reconnect_interval * 1000);

    }

    _ping () {

        this._ping_id_interval = setTimeout( () => {

            let diff = Date.now() - this._last_pong;

            if (this._status === 'open' || this._status === 'connecting') {
                
                if (diff > this._config.ttl * 1000) {

                    try {

                        this._ws_client.removeAllListeners('error');
                        this._ws_client.removeAllListeners('close');
                        this._ws_client.removeAllListeners('message');
                        this._ws_client.removeAllListeners('pong');
                        this._ws_client.removeAllListeners('open');
                    
                        this._ws_client.terminate();

                    } catch (error) {
                        this.emit('error', error);
                    }

                    this._reconnect();
    
                    this.emit('error', new Error(`TTL connection ${this._config.ttl} sec is over`));

                } else {
                    this._ws_client.ping(this._last_pong);
                }

            }

            this._ping();

        }, this._config.heartbeat * 1000);

    }

}