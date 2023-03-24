import type { APIGatewayProxyEvent, APIGatewayProxyResult, SQSEvent, Handler, } from 'aws-lambda';

type POSTAPIGatewayProxyEvent<S> = Omit<APIGatewayProxyEvent, 'body'> & { body: S };
export type EventPOSTAPIGatewayProxyEvent<S> = Handler<POSTAPIGatewayProxyEvent<S>, APIGatewayProxyResult>;

type GETAPIGatewayProxyEvent<P = void, Q = void> = Omit<
    APIGatewayProxyEvent,
    'pathParameters' | 'queryStringParameters'
> & { pathParameters?: P; queryStringParameters?: Q };
export type EventGETAPIGatewayProxyEvent<P = void, Q = void> = Handler<
    GETAPIGatewayProxyEvent<P, Q>,
    APIGatewayProxyResult
>;

export type EventSQSEvent = Handler<SQSEvent>;

export interface CreateProductBody {
    title: string;
    description: string;
    price: number;
    img_url: string;
}

export interface CreatedProductData extends CreateProductBody {
    id: string;
}

export interface CreatedStockData {
    id: string;
    count: number;
    product_id: string;
}

export interface ProductData {
    id: string;
    title: string;
    description: string;
    price: number;
    img_url: string;
    count: number;
}
