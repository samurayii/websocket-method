export interface IWebsocketServerInfo {
    host: string
    port: number
    prefix: string
    protocol: string
    heartbeat: number
    ttl: number
    max_payload: string
    auth: boolean
    connections: number
}