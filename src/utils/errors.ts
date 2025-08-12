export class HttpError extends Error {
    statusCode: number;

    constructor(status: number, message: string) {
        super('Error: ' + message);
        this.statusCode = status;
    }
}
