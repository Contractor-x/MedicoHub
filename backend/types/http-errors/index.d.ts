declare module 'http-errors' {
    export interface HttpError extends Error {
        status?: number;
        statusCode?: number;
    }
    export default function createError(status: number, message?: string): HttpError;
}
