import getProductsDbController from '@libs/products-db-controller';
import { prepareResponse, checkIfOriginAllowed } from '@libs/api-gateway';
import { BaseError, BadRequestError } from '@libs/errors';
import { RESP_STATUS_CODES } from '@constants';

import { type EventPOSTAPIGatewayProxyEvent, type CreateProductBody } from '@types';

export const MSG_PRODUCT_CREATED = 'Created new Coffee Shop product.';
export const MSG_INVALID_PRODUCT_DATA = 'Invalid new Coffee Shop product data.';

const isValidCreateProductBody = (data: any): data is CreateProductBody => {
    const { title, description, price, img_url } = data;

    return (
        typeof title === 'string' &&
        typeof description === 'string' &&
        typeof img_url === 'string' &&
        Number.isFinite(price)
    );
};

const getProductById: EventPOSTAPIGatewayProxyEvent<string> = async (event) => {
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
        const createProductBody = JSON.parse(event?.body);
        console.log('Create product Lambda triggered, body params: ', createProductBody);

        if (!isValidCreateProductBody(createProductBody)) {
            throw new BadRequestError(MSG_INVALID_PRODUCT_DATA);
        }

        const createdData = await getProductsDbController().createProduct(createProductBody);

        return prepareResponse(
            {
                message: MSG_PRODUCT_CREATED,
                data: createdData,
            },
            requestOrigin,
            RESP_STATUS_CODES.CREATED
        );
    } catch (error) {
        console.error('Create product request error', error);

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
