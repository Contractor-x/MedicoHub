declare module 'glob' {
    export interface GlobOptions {
        [key: string]: any;
    }
    export function sync(pattern: string, options?: GlobOptions): string[];
    export default function glob(pattern: string, options: GlobOptions, cb: (err: Error | null, matches: string[]) => void): void;
}
