export interface IWebsocketClientConfig {
    url: string
    reconnect_interval?: number
    heartbeat?: number
    ttl?: number
    max_payload?: string
    reject_unauthorized?: boolean
    headers?: {
        [key: string]: string
    }
    auth?: {
        token?: string
        password?: string
        login?: string 
    }
}

