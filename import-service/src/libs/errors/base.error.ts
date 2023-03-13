import { RESP_STATUS_CODES } from '@constants';

export class BaseError extends Error {
    name: string;
    message: string;
    code: number;

    constructor(message: string) {
        super(message);
        this.name = 'Base Error';
        this.message = message;
        this.code = RESP_STATUS_CODES.INTERNAL_ERROR;

        Error.captureStackTrace(this, this.constructor);
    }
}
