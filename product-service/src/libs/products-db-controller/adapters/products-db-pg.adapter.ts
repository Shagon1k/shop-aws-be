import { Client as PGDBClient } from 'pg';
import { DEFAULT_ITEM_STOCK_COUNT } from '../constants';

import { type IProductsDBController } from '../products-db-controller';

const { PG_HOST, PG_PORT, PG_DATABASE, PG_USERNAME, PG_PASSWORD } = process.env;

const QUERIES = {
    GET_PRODUCTS_LIST:
        'SELECT p.id, p.title, p.description, p.price, p.img_url, s.count FROM products p INNER JOIN stocks s ON (s.product_id = p.id)',
    GET_PRODUCT_BY_ID:
        'SELECT p.id, p.title, p.description, p.price, p.img_url, s.count FROM products p INNER JOIN stocks s ON (s.product_id = p.id) WHERE (p.id = $1)',
    CREATE_PRODUCT:
        'INSERT INTO products (title, description, price, img_url) VALUES($1, $2, $3, $4) RETURNING *',
    CREATE_STOCK: 'INSERT INTO stocks (count, product_id) VALUES($1, $2)',
};

const createDbClient = async () => {
    const options = {
        host: PG_HOST,
        port: Number(PG_PORT),
        database: PG_DATABASE,
        user: PG_USERNAME,
        password: PG_PASSWORD,
        ssl: {
            rejectUnauthorized: false,
        },
        connectionTimeoutMillis: 5000, // time in millisecond for termination of the database query
    };

    const client = new PGDBClient(options);
    await client.connect();

    return client;
};

const productsDbPgAdapter: IProductsDBController = {
    async getProductsList() {
        const dbClient = await createDbClient();
        try {
            const { rows: resultData } = await dbClient.query(QUERIES.GET_PRODUCTS_LIST);

            return resultData;
        } catch (error) {
            // re-throw error outside to handle on lambda handler function
            throw error;
        } finally {
            dbClient.end();
        }
    },

    async getProductById(productId: string) {
        const dbClient = await createDbClient();

        try {
            const dbData = await dbClient.query(QUERIES.GET_PRODUCT_BY_ID, [productId]);
            const resultData = dbData?.rows?.[0] || null;

            return resultData;
        } catch (error) {
            // re-throw error outside to handle on lambda handler function
            throw error;
        } finally {
            dbClient.end();
        }
    },

    async createProduct(createProductBody) {
        const dbClient = await createDbClient();
        try {

            await dbClient.query('BEGIN'); // start creation transaction

            // Creating new product
            const { rows: createdProductsData } = await dbClient.query(QUERIES.CREATE_PRODUCT, [
                createProductBody.title,
                createProductBody.description,
                createProductBody.price,
                createProductBody.img_url
            ]);

             // Creating stock to new product
            const newProductId = createdProductsData?.[0]?.id;
            await dbClient.query(QUERIES.CREATE_STOCK, [
                DEFAULT_ITEM_STOCK_COUNT,
                newProductId
            ]);

            await dbClient.query('COMMIT'); // commit creation transaction

            // Get newly created product
            const dbNewProductData = await dbClient.query(QUERIES.GET_PRODUCT_BY_ID, [newProductId]);
            const resultData = dbNewProductData?.rows?.[0];

            return resultData;
        } catch (error) {
            await dbClient.query('ROLLBACK') // rollback creation transaction

            // re-throw error outside to handle on lambda handler function
            throw error;
        } finally {
            dbClient.end();
        }
    },
};

export default productsDbPgAdapter;
