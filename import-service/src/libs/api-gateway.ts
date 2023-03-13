import { ALLOWED_REQUEST_ORIGINS } from '../config';
import { RESP_STATUS_CODES } from '@constants';

export const checkIfOriginAllowed = (requestOrigin: string) => {
    return ALLOWED_REQUEST_ORIGINS.indexOf(requestOrigin) > -1;
};

export const prepareResponse = (
    response: Record<string, unknown>,
    requestOrigin: string,
    statusCode: number = RESP_STATUS_CODES.OK
) => {
    return {
        statusCode,
        headers: {
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Origin': requestOrigin,
            'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
        },
        body: JSON.stringify(response),
    };
};
