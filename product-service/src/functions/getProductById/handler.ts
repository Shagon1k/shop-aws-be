import { prepareResponse, checkIfOriginAllowed } from '@libs/api-gateway';
import { type EventGETAPIGatewayProxyEvent } from '@types';
import { BaseError, NotFoundError } from '@libs/errors';
import { RESP_STATUS_CODES } from '@constants';
// Note: Mocked data used temporary
import { products } from '../../mocks/products.mock';

export const MSG_PRODUCT_FOUND = 'Coffee product found.';
export const MSG_PRODUCT_NOT_FOUND = 'No coffee product with such ID.';

export type AddProductPathParams = {
    productId: string;
};

const getProductById: EventGETAPIGatewayProxyEvent<AddProductPathParams> = async (event) => {
    const requestOrigin = event.headers.origin || '';

    try {
        console.log('Get product by ID Lambda triggered, params: ', event.pathParameters);

        // CORS not allowed fast return
        if (!checkIfOriginAllowed(requestOrigin)) {
            return prepareResponse(
                {
                    message: 'Not allowed',
                },
                '',
                RESP_STATUS_CODES.FORBIDDEN
            );
        }

        const productId = event?.pathParameters?.productId || '';
        const productData = products.find(({ id }) => id === productId);
        if (!productData) {
            throw new NotFoundError(MSG_PRODUCT_NOT_FOUND);
        }

        return prepareResponse(
            {
                message: MSG_PRODUCT_FOUND,
                data: productData,
            },
            requestOrigin,
            RESP_STATUS_CODES.OK
        );
    } catch (error) {
        console.error('Get product by ID request error', error);

        if (error instanceof BaseError) {
            const { code, stack, message } = error;
            return prepareResponse({ stack, message }, requestOrigin, code);
        } else if (error instanceof Error) {
            const { message, stack } = error;
            return prepareResponse({ stack, message }, requestOrigin, RESP_STATUS_CODES.INTERNAL_ERROR);
        }

        return prepareResponse(
            { message: 'Internal server error.' },
            requestOrigin,
            RESP_STATUS_CODES.INTERNAL_ERROR
        );
    }
};

export default getProductById;
