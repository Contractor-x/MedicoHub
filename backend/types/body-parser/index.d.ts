declare module 'body-parser' {
    export interface BodyParserOptions {
        [key: string]: any;
    }
    export function json(options?: BodyParserOptions): any;
    export function urlencoded(options?: BodyParserOptions): any;
    export default {
        json,
        urlencoded
    };
}
