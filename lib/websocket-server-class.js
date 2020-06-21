const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const WebSocket = require('ws');
const ConnectionClass = require('./connection-class');
const convertMaxPayload = require('./convert-max-payload');

module.exports = class WebsocketServerClass extends EventEmitter {

    constructor (config) {

        super();

        this._listen_flag = false;
        this._connections_list = {};

        this._config = {
            host: "*",
            port: 8080,
            prefix: "/",
            protocol: "ws",
            heartbeat: 30,
            max_payload: "100kb",
            cert: "cert.pem",
            key: "key.pem",
            auth: false,
            ...config
        };

        this._config.max_payload = convertMaxPayload(this._config.max_payload);

        if (this._config.host === '*' || this._config.host === '0.0.0.0') {
            this._config.host = undefined;
        }

        const server_settings = {
            maxPayload: this._config.max_payload,
            perMessageDeflate: false,
            clientTracking: true,
            noServer: true,
            path: this._config.prefix
        }

        if (this._config.protocol === 'wss') {

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

    listen () {

        return new Promise( (resolve, reject) => {

            if (this._listen_flag === false) {

                this._listen_flag = true;
    
                this._server = this._http_server.listen(this._config.port, this._config.host, () => {

                    this._server.removeAllListeners('error');

                    this._http_server.removeAllListeners('error');
                    this._http_server.removeAllListeners('upgrade');
                    this._ws_server.removeAllListeners('connection');

                    this._ws_server.on('connection', (ws) => {

                        const connection = new ConnectionClass(ws);

                        this._connections_list[connection.id] = connection;
                        
                        connection.on('message', (message) => {
console.log(`Received message ${message} from user ${connection.id}`);
                            this.emit('message', message, connection);
                        });

                        connection.on('close', () => {
console.log(`close connection ${connection.id}`);
                            delete this._connections_list[connection.id];
                            this.emit('close', connection);
                        });

                        connection.on('error', () => {
                            delete this._connections_list[connection.id];
                            connection.terminate();
                            this.emit('close', connection);
                        });

                        this.emit('open', connection);

                    });
            
                    this._http_server.on('upgrade', (request, socket, head) => {
            
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
            
                            let auth_string = request.headers.authorization.replace(/(^Basic|^Bearer)/gi, '').trim();
            
                            this.emit('authorization', type_auth, auth_string, (result) => {
            
                                if (result === true) {
                                    this._ws_server.handleUpgrade(request, socket, head, (ws) => {
                                        this._ws_server.emit('connection', ws, request);
                                    });
                                } else {
                                    socket.destroy();
                                    return;
                                }
            
                            });
            
                        } else {
                            this._ws_server.handleUpgrade(request, socket, head, (ws) => {
                                this._ws_server.emit('connection', ws, request);
                            });
                        }
            
                    });

                    resolve();

                });

                this._server.once('error', (error) => {
                    reject(error);
                });
    
            } else {
                resolve();
            }

        });

    }

    close () {

        return new Promise( (resolve, reject) => {

            if (this._listen_flag === true) {

                this._listen_flag = false;

                this._server.close(() => {
                    this._server.removeAllListeners('error');
                    resolve();
                });

                this._server.once('error', (error) => {
                    reject(error);
                });

            } else {
                resolve();
            }

        });

    }
    
}