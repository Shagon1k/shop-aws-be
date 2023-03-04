import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { type EventGETAPIGatewayProxyEvent } from '@types';
import { prepareResponse, checkIfOriginAllowed } from '@libs/api-gateway';
import { RESP_STATUS_CODES } from '@constants';
// Note: Mocked data used temporary
// import { products } from '../../mocks/products.mock';

export const MSG_PRODUCTS_FOUND = 'Coffee products list.';

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

        // TODO: START (move to DB service)
        const dbClient = new DynamoDBClient({ region: process.env.DB_REGION });

        const { Items: dbProducts = [] } = await dbClient.send(
            new ScanCommand({
                TableName: process.env.DYNAMO_PRODUCTS_TABLE_NAME || '',
            })
        );
        const products = dbProducts.map((item) => unmarshall(item));

        const { Items: dbStocks = [] } = await dbClient.send(
            new ScanCommand({
                TableName: process.env.DYNAMO_STOCKS_TABLE_NAME || '',
            })
        );
        const stocks = dbStocks.map((item) => unmarshall(item));

        const resultData = products.map((product) => {
            const productStockCount = stocks.find(({ product_id }) => product.id === product_id)?.count;

            return {
                ...product,
                count: productStockCount,
            };
        });
        // TODO: END (move to DB service)

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
