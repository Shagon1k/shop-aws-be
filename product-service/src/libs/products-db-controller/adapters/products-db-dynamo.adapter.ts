import { DynamoDBClient, ScanCommand, QueryCommand, TransactWriteItemsCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { v4 as uuidV4 } from 'uuid';
import { DEFAULT_ITEM_STOCK_COUNT } from '../constants';

import { type CreatedProductData, type CreatedStockData } from '@types';
import { type IProductsDBController } from '../products-db-controller';

const { REGION, DYNAMO_PRODUCTS_TABLE_NAME, DYNAMO_STOCKS_TABLE_NAME, DYNAMO_STOCKS_PRODUCT_ID_INDEX } =
    process.env;

const createDbClient = () => new DynamoDBClient({ region: REGION });

const productsDbDynamoAdapter: IProductsDBController = {
    async getProductsList() {
        const dbClient = createDbClient();

        const { Items: dbProducts = [] } = await dbClient.send(
            new ScanCommand({
                TableName: DYNAMO_PRODUCTS_TABLE_NAME || '',
            })
        );
        const products = dbProducts.map((item) => unmarshall(item)) as CreatedProductData[];

        const { Items: dbStocks = [] } = await dbClient.send(
            new ScanCommand({
                TableName: DYNAMO_STOCKS_TABLE_NAME || '',
            })
        );
        const stocks = dbStocks.map((item) => unmarshall(item)) as CreatedStockData[];

        const resultData = products.map((product) => {
            const productStockCount = stocks.find(({ product_id }) => product.id === product_id)
                ?.count as number;

            return {
                ...product,
                count: productStockCount,
            };
        });

        return resultData;
    },

    async getProductById(productId: string) {
        const dbClient = createDbClient();

        const { Items: dbProducts = [] } = await dbClient.send(
            new QueryCommand({
                TableName: DYNAMO_PRODUCTS_TABLE_NAME || '',
                KeyConditionExpression: 'id = :id',
                ExpressionAttributeValues: { ':id': { S: productId } },
            })
        );
        const [product] = dbProducts.map((item) => unmarshall(item)) as CreatedProductData[];

        const { Items: dbStocks = [] } = await dbClient.send(
            new QueryCommand({
                TableName: DYNAMO_STOCKS_TABLE_NAME || '',
                // Note: Specific index was created to provide ability on query by product_id (non-partition) field value
                IndexName: DYNAMO_STOCKS_PRODUCT_ID_INDEX,
                KeyConditionExpression: 'product_id = :product_id',
                ExpressionAttributeValues: { ':product_id': { S: productId } },
            })
        );
        const [stock] = dbStocks.map((item) => unmarshall(item)) as CreatedStockData[];

        if (!product || !stock) {
            return null;
        }

        return {
            ...product,
            count: stock?.count || 0,
        };
    },

    async createProduct(createProductBody) {
        const dbClient = createDbClient();

        const createProductId = uuidV4();
        const createProductData = {
            id: createProductId,
            ...createProductBody,
        };
        const createStockData = {
            id: uuidV4(),
            count: DEFAULT_ITEM_STOCK_COUNT,
            product_id: createProductId,
        };
        const createProductDBData = marshall(createProductData);
        const createStockDBData = marshall(createStockData);

        await dbClient.send(
            new TransactWriteItemsCommand({
                TransactItems: [
                    {
                        Put: {
                            TableName: DYNAMO_PRODUCTS_TABLE_NAME || '',
                            Item: createProductDBData,
                        }
                    },
                    {
                        Put: {
                            TableName: DYNAMO_STOCKS_TABLE_NAME || '',
                            Item: createStockDBData,
                        }
                    }
                ]

            })
        );

        return {
            product: createProductData,
            stock: createStockData,
        };
    },
};

export default productsDbDynamoAdapter;
