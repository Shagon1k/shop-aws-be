import getProductsDbController from '@libs/products-db-controller'
import { prepareResponse, checkIfOriginAllowed } from '@libs/api-gateway';
import { BaseError, NotFoundError } from '@libs/errors';
import { RESP_STATUS_CODES } from '@constants';

import { type EventGETAPIGatewayProxyEvent } from '@types';

export const MSG_PRODUCT_FOUND = 'Coffee Shop product found.';
export const MSG_PRODUCT_NOT_FOUND = 'No Coffee Shop product with such ID.';

export type AddProductPathParams = {
    productId: string;
};

const getProductById: EventGETAPIGatewayProxyEvent<AddProductPathParams> = async (event) => {
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
        const params = event.pathParameters;
        console.log('Get product by ID Lambda triggered, params: ', params);

        const productId = params?.productId || '';
        const productsDbController = getProductsDbController();
        const resultData = await productsDbController.getProductById(productId);

        if (!resultData) {
            throw new NotFoundError(MSG_PRODUCT_NOT_FOUND);
        }

        return prepareResponse(
            {
                message: MSG_PRODUCT_FOUND,
                data: resultData,
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
