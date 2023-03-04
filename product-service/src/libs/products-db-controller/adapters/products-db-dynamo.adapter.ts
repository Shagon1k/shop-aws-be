import { DynamoDBClient, ScanCommand, QueryCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { v4 as uuidV4 } from 'uuid';
import { type CreatedProductData, type CreatedStockData } from '@types';
import { type IProductsDBController } from '../products-db-controller';

const DEFAULT_ITEM_STOCK_COUNT = 10;

const createDbClient = () => new DynamoDBClient({ region: process.env.DB_REGION });

const productsDbDynamoAdapter: IProductsDBController = {
    async getProductsList() {
        const dbClient = createDbClient();

        const { Items: dbProducts = [] } = await dbClient.send(
            new ScanCommand({
                TableName: process.env.DYNAMO_PRODUCTS_TABLE_NAME || '',
            })
        );
        const products = dbProducts.map((item) => unmarshall(item)) as CreatedProductData[];

        const { Items: dbStocks = [] } = await dbClient.send(
            new ScanCommand({
                TableName: process.env.DYNAMO_STOCKS_TABLE_NAME || '',
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
        const dbClient = new DynamoDBClient({ region: process.env.DB_REGION });

        const { Items: dbProducts = [] } = await dbClient.send(
            new QueryCommand({
                TableName: process.env.DYNAMO_PRODUCTS_TABLE_NAME || '',
                KeyConditionExpression: 'id = :id',
                ExpressionAttributeValues: { ':id': { S: productId } },
            })
        );
        const [product] = dbProducts.map((item) => unmarshall(item)) as CreatedProductData[];

        const { Items: dbStocks = [] } = await dbClient.send(
            new QueryCommand({
                TableName: process.env.DYNAMO_STOCKS_TABLE_NAME || '',
                // Note: Specific index was created to provide ability on query by product_id (non-partition) field value
                IndexName: process.env.DYNAMO_STOCKS_PRODUCT_ID_INDEX,
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
        const dbClient = new DynamoDBClient({ region: process.env.DB_REGION });

        const createProductId = uuidV4();
        const createProductData = {
            id: createProductId,
            ...createProductBody,
        };
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
        };
        const createStockDBData = marshall(createStockData);
        await dbClient.send(
            new PutItemCommand({
                TableName: process.env.DYNAMO_STOCKS_TABLE_NAME || '',
                Item: createStockDBData,
            })
        );

        return {
            product: createProductData,
            stock: createStockData,
        };
    },
};

export default productsDbDynamoAdapter;
