export interface IWebsocketServerConfig {
    host?: string
    port?: number
    prefix?: string
    protocol?: string
    heartbeat?: number
    ttl?: number
    max_payload?: string
    cert?: string
    key?: string
    auth?: boolean
}