import { BaseError } from './base.error';
import { RESP_STATUS_CODES } from '@constants';

export class BadRequestError extends BaseError {
    name: string;
    message: string;
    code: number;

    constructor(message: string) {
        super(message);
        this.name = 'Bad Request Error';
        this.message = message;
        this.code = RESP_STATUS_CODES.BAD_REQUEST;

        Error.captureStackTrace(this, this.constructor);
    }
}
