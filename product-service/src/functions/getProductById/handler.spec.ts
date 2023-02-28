import { type Context, type Callback } from 'aws-lambda';
import getProductById, { MSG_PRODUCT_FOUND, MSG_PRODUCT_NOT_FOUND } from './handler';
import { prepareResponse, checkIfOriginAllowed } from '@libs/api-gateway';
import { RESP_STATUS_CODES } from '@constants';

jest.mock('@libs/api-gateway');
jest.mock('../../mocks/products.mock', () => ({
    products: [
        {
            id: '42',
        },
    ],
}));

describe('getProductById lambda', () => {
    describe('when request origin is allowed', () => {
        beforeAll(() => {
            (checkIfOriginAllowed as jest.Mock).mockReturnValue(true);
        });

        it('should return HTTP response with product if exists', async () => {
            const mockedOrigin = 'some-origin';
            const mockedEvent = {
                headers: {
                    origin: mockedOrigin,
                },
                pathParameters: {
                    productId: '42',
                },
            } as any;

            await getProductById(mockedEvent, {} as Context, {} as Callback);

            expect(prepareResponse).toHaveBeenCalledWith(
                {
                    message: MSG_PRODUCT_FOUND,
                    data: {
                        id: '42',
                    },
                },
                mockedOrigin,
                RESP_STATUS_CODES.OK
            );
        });

        it('should return HTTP error Not Found if product does NOT exist', async () => {
            const mockedOrigin = 'some-origin';
            const mockedEvent = {
                headers: {
                    origin: mockedOrigin,
                },
                pathParameters: {
                    productId: '40',
                },
            } as any;

            await getProductById(mockedEvent, {} as Context, {} as Callback);

            expect(prepareResponse).toHaveBeenCalledWith(
                {
                    message: MSG_PRODUCT_NOT_FOUND,
                    stack: expect.any(String),
                },
                mockedOrigin,
                RESP_STATUS_CODES.NOT_FOUND
            );
        });
    });

    describe('when request origin is NOT allowed', () => {
        beforeAll(() => {
            (checkIfOriginAllowed as jest.Mock).mockReturnValue(false);
        });

        it('should return not allowed CORS HTTP response', async () => {
            const mockedOrigin = 'some-origin';
            const mockedEvent = {
                headers: {
                    origin: mockedOrigin,
                },
            } as any;

            await getProductById(mockedEvent, {} as Context, {} as Callback);

            expect(prepareResponse).toHaveBeenCalledWith(expect.any(Object), '', RESP_STATUS_CODES.FORBIDDEN);
        });
    });
});
