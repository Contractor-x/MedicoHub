declare module 'range-parser' {
    export interface Range {
        start: number;
        end: number;
        size?: number;
    }
    export default function parse(range: string, size: number): Range[] | -1 | -2;
}
