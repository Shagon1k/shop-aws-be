import { type CreateProductBody } from '@types';

export const isValidCreateProductBody = (data: any): data is CreateProductBody => {
    const { title, description, price, img_url } = data;

    return (
        typeof title === 'string' &&
        typeof description === 'string' &&
        typeof img_url === 'string' &&
        Number.isFinite(price)
    );
};
