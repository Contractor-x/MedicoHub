declare module 'send' {
    export interface SendOptions {
        [key: string]: any;
    }
    export default function send(req: any, path: string, options?: SendOptions): any;
}
