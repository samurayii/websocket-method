# Websocket-method

Json websocket server/client.

install: `npm i websocket-method`

### Example

```js
const { WebsocketMethodServerClass, WebsocketMethodClientClass } = require("websocket-method");

const client_config = {
    url: "ws://localhost:5005/websocket"
};
const server_config = {
    port: 5005,
    prefix: "/websocket"
};

const server = new WebsocketMethodServerClass(server_config);
const client = new WebsocketMethodClientClass(client_config);

server.listen().then( () => {

    console.log("Server open on port 5005");

    client.connect().then( () => {
        console.log("Client connected");
    });

});
```

## Server

### new ServerClass(options) -> Server;

Create WebsocketMethodServerClass instance.

options:
- **host:** "*" -> listening host
- **port: 8080** -> listening port
- **prefix: "/"** -> listening prefix
- **protocol: "ws"** -> server protocol (ws or wss)
- **heartbeat: 30** -> heartbeat connection in seconds
- **ttl: 90** -> ttl connection in seconds
- **max_payload: "100kb"** -> maxPayload connection (kb,b or mb)
- **cert: "cert.pem"** - path to cert
- **key: "key.pem"** - path to key
- **auth: false** - enable authorization

### Server.info -> Object

Object with server information.

### Server.listen() → Promise

Start server.

### Server.close() → Promise

Close server.

### Server.getConnectionsList (): string[]

Return list of Id connections.

### Server.getConnection (connection_id: string) -> Connection

Return connection instance.

### Server.send (method: string, message: any, headers: object = {}, connection_id?: string) -> Promise

Send message to all clients. If set **connection_id**, send message only to id client.

### Server.on("close", (Connection) => {})

Emitted when close connection.

### Server.on("error", (error) => {})

Emitted when error.

### Server.on("open", (Connection) => {})

Emitted when open connection.

### Server.on("authorization", (type_auth: string, auth_string: string, callback) => {})

Emitted when authorization request is being.

arguments:
- **auth_type** -> authorization type (Basic or Bearer)
- **auth_string** -> authorization string
- **callback** -> response function (true or false)

### Server.on([method], (body, headers, Connection) => {})

Emitted when received message with method.

arguments:
- **body** -> body of message
- **headers** -> headers object
- **Connection** -> connection instance.

## Connection

### Connection.id -> string

Get ID connection.

### Connection.protocol (): string

Get Connection.protocol connection.

### Connection.status (): string

Get status connection.

### Connection.close() -> Promise

Close connection.

### Connection.send (method: string, message: any, headers: object = {}) -> Promise

Send message to client.

## Client

### new ClientClass(options) -> Client;

Create WebsocketMethodServerClass instance.

options:
- **url: "ws://localhost:8080/websocket"** -> url to server
- **reconnect_interval: 10** -> reconnect interval connection in seconds
- **heartbeat: 30** -> heartbeat connection in seconds
- **ttl: 90** -> ttl connection in seconds
- **max_payload: "100kb"** -> maxPayload connection (kb,b or mb)
- **headers: {}** -> http headers object
- **auth: {}** -> authorization object
    - **login** -> login to server (Basic)
    - **password** -> password to server (Basic)
    - **token** -> token to server (Bearer)
- **reject_unauthorized: true** -> reject unauthorized equest (true/false)

### Client.status -> string

Get status connection.

### Client.info -> Object

Object with client information.

### Client.connect() -> Promise

Connecting to server.

### Client.close() -> Promise

Close connection.

### Client.send(method: string, message: any, headers: object = {}) -> Promise

Send message to server.

### Client.terminate()

Terminate client connection.

### Client.on("open", () => {})

Emitted when open connection.

### Client.on("close", () => {})

Emitted when close connection.

### Client.on("reconnecting", () => {})

Emitted when enabled reconnecting.

### Client.on("error", (error) => {})

Emitted when error.

### Client.on([method], (body, headers) => {})

Emitted when received message with method.

arguments:
- **body** -> body of message
- **headers** -> headers object