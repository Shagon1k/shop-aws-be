import { type EventGETAPIGatewayProxyEvent } from '@types';
import { prepareResponse, checkIfOriginAllowed } from '@libs/api-gateway';
import { RESP_STATUS_CODES } from '@constants';
// Note: Mocked data used temporary
import { products } from '../../mocks/products.mock';

export const MSG_PRODUCTS_FOUND = 'Coffee products list.';

const getProductsList: EventGETAPIGatewayProxyEvent = async (event) => {
    const requestOrigin = event.headers.origin || '';

    try {
        console.log('Get products Lambda triggered');

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

        return prepareResponse(
            {
                message: MSG_PRODUCTS_FOUND,
                data: products,
            },
            requestOrigin,
            RESP_STATUS_CODES.OK
        );
    } catch (error) {
        console.error('Get products list request error', error);

        if (error instanceof Error) {
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

export default getProductsList;
