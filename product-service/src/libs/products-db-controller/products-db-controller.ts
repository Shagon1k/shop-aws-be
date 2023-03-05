import productsDbDynamoAdapter from './adapters/products-db-dynamo.adapter';
import productsDbPgAdapter from './adapters/products-db-pg.adapter';

import {
    type ProductData,
    type CreateProductBody,
    type CreatedProductData,
    type CreatedStockData,
} from '@types';

export interface IProductsDBController {
    getProductsList: () => Promise<ProductData[]>;
    getProductById: (id: string) => Promise<ProductData | null>;
    createProduct: (createProductBody: CreateProductBody) => Promise<{
        product: CreatedProductData;
        stock: CreatedStockData;
    }>;
}

const getProductsDbController = (): IProductsDBController => {
    if (process.env.DB_TYPE === 'PG') {
        return productsDbPgAdapter;
    } else {
        return productsDbDynamoAdapter;
    }
};

export default getProductsDbController;
