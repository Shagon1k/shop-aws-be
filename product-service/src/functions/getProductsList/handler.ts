import getProductsDbController from '@libs/products-db-controller'
import { prepareResponse, checkIfOriginAllowed } from '@libs/api-gateway';
import { RESP_STATUS_CODES } from '@constants';

import { type EventGETAPIGatewayProxyEvent } from '@types';

export const MSG_PRODUCTS_FOUND = 'Coffee Shop products list.';

const getProductsList: EventGETAPIGatewayProxyEvent = async (event) => {
    const requestOrigin = event.headers.origin || '';
    try {
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

        // Request handle
        console.log('Get products Lambda triggered');

        const productsDbController = getProductsDbController();
        const resultData = await productsDbController.getProductsList();
        return prepareResponse(
            {
                message: MSG_PRODUCTS_FOUND,
                data: resultData,
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
