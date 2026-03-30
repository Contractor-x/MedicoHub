declare module 'qs' {
    export function stringify(obj: Record<string, any>, options?: Record<string, any>): string;
    export function parse(str: string, options?: Record<string, any>): Record<string, any>;
    export default { stringify, parse };
}
