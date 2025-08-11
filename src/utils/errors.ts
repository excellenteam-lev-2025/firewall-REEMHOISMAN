
export class BadRequestError extends Error {
    statusCode: number;

    constructor(message: string) {
        super('Invalid request body: ' + message);
        this.statusCode = 400;
    }
}

export class ConflictError extends Error {
    statusCode: number;

    constructor(message: string) {
        super('Conflict: ' + message);
        this.statusCode = 409;
    }
}
