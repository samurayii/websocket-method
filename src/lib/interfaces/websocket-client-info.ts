export interface IWebsocketClientInfo {
    url: string
    reconnect_interval: number
    heartbeat: number
    ttl: number
    max_payload: string
    status: string
    last_pong: number
}