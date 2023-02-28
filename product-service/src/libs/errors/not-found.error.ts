import { BaseError } from './base.error';
import { RESP_STATUS_CODES } from '@constants';

export class NotFoundError extends BaseError {
    name: string;
    message: string;
    code: number;

    constructor(message: string) {
        super(message);
        this.name = 'Not Found Error';
        this.message = message;
        this.code = RESP_STATUS_CODES.NOT_FOUND;

        Error.captureStackTrace(this, this.constructor);
    }
}
