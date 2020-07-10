export interface IMessageMethod {
    method: string
    body: unknown
    headers: {
        [key: string]: string
    }
}