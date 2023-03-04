import { type IProductsDBController } from '../products-db-controller';

const productsDbPgAdapter: IProductsDBController = {
    async getProductsList() {
        //TBD
    },

    async getProductById(productId: string) {
        //TBD
    },

    async createProduct(createProductBody) {
        //TBD
    },
};

export default productsDbPgAdapter;
