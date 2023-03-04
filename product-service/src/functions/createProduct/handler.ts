import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import { v4 as uuidV4 } from 'uuid';
import { prepareResponse, checkIfOriginAllowed } from '@libs/api-gateway';
import { type EventPOSTAPIGatewayProxyEvent } from '@types';
import { BaseError, BadRequestError } from '@libs/errors';
import { RESP_STATUS_CODES } from '@constants';

const DEFAULT_ITEM_STOCK_COUNT = 10;

export const MSG_PRODUCT_CREATED = 'Created new coffee product.';
export const MSG_INVALID_PRODUCT_DATA = 'Invalid new coffee product data.';

export type CreateProductData = {
    title: string;
    description: string;
    price: number;
    imgUrl: string;
};

const isValidCreateProductData = (data: any): data is CreateProductData => {
    const { title, description, price, imgUrl } = data;

    return (
        typeof title === 'string' &&
        typeof description === 'string' &&
        typeof imgUrl === 'string' &&
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

        if (!isValidCreateProductData(createProductBody)) {
            throw new BadRequestError(MSG_INVALID_PRODUCT_DATA);
        }

        // TODO: START (move to DB service)
        const dbClient = new DynamoDBClient({ region: process.env.DB_REGION });

        const createProductId = uuidV4();
        const createProductData = {
            id: createProductId,
            ...createProductBody
        }
        const createProductDBData = marshall(createProductData);
        await dbClient.send(
            new PutItemCommand({
                TableName: process.env.DYNAMO_PRODUCTS_TABLE_NAME || '',
                Item: createProductDBData,
            })
        );

        const createStockData = {
            id: uuidV4(),
            count: DEFAULT_ITEM_STOCK_COUNT,
            product_id: createProductId,
        }
        const createStockDBData = marshall(createStockData);
        await dbClient.send(
            new PutItemCommand({
                TableName: process.env.DYNAMO_STOCKS_TABLE_NAME || '',
                Item: createStockDBData,
            })
        );
        // TODO: END (move to DB service)

        return prepareResponse(
            {
                message: MSG_PRODUCT_CREATED,
                data: {
                    product: createProductData,
                    stock: createStockData,
                },
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
