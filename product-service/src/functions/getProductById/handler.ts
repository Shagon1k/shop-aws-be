import { DynamoDBClient, QueryCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { prepareResponse, checkIfOriginAllowed } from '@libs/api-gateway';
import { type EventGETAPIGatewayProxyEvent } from '@types';
import { BaseError, NotFoundError } from '@libs/errors';
import { RESP_STATUS_CODES } from '@constants';
// Note: Mocked data used temporary
// import { products } from '../../mocks/products.mock';

export const MSG_PRODUCT_FOUND = 'Coffee product found.';
export const MSG_PRODUCT_NOT_FOUND = 'No coffee product with such ID.';

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

        // TODO: START (move to DB service)
        const dbClient = new DynamoDBClient({ region: process.env.DB_REGION });

        const { Items: dbProducts = [] } = await dbClient.send(
            new QueryCommand({
                TableName: process.env.DYNAMO_PRODUCTS_TABLE_NAME || '',
                KeyConditionExpression: 'id = :id',
                ExpressionAttributeValues: { ':id': { S: productId } },
            })
        );
        const [product] = dbProducts.map((item) => unmarshall(item));

        const { Items: dbStocks = [] } = await dbClient.send(
            new QueryCommand({
                TableName: process.env.DYNAMO_STOCKS_TABLE_NAME || '',
                // Note: Specific index was created to provide ability on query by product_id (non-partition) field value
                IndexName: process.env.DYNAMO_STOCKS_PRODUCT_ID_INDEX,
                KeyConditionExpression: 'product_id = :product_id',
                ExpressionAttributeValues: { ':product_id': { S: productId } },
            })
        );
        const [stock] = dbStocks.map((item) => unmarshall(item));
        // TODO: END (move to DB service)

        if (!product) {
            throw new NotFoundError(MSG_PRODUCT_NOT_FOUND);
        }

        const resultData = {
            ...product,
            count: stock?.count || 0,
        };

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
