import { checkIfOriginAllowed, prepareResponse } from '../api-gateway';
import { RESP_STATUS_CODES } from '@constants';

jest.mock('../../config', () => ({
    ALLOWED_REQUEST_ORIGINS: ['allowed-origin'],
}));

describe('checkIfOriginAllowed helper', () => {
    it('should return false if passed origin is not allowed', () => {
        expect(checkIfOriginAllowed('not-allowed-origin')).toBe(false);
    });

    it('should return false if passed origin is not allowed', () => {
        expect(checkIfOriginAllowed('allowed-origin')).toBe(true);
    });
});

describe('prepareResponse helper', () => {
    it('should return prepared response', () => {
        const mockedOrigin = 'origin';
        const mockedResp = { key: 'value' };
        const mockedStatusCode = RESP_STATUS_CODES.OK;
        const result = prepareResponse(mockedResp, mockedOrigin, mockedStatusCode);

        expect(result).toEqual({
            statusCode: mockedStatusCode,
            headers: {
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Origin': mockedOrigin,
                'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
            },
            body: JSON.stringify(mockedResp),
        });
    });
});
