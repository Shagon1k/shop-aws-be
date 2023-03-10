import type { APIGatewayProxyEvent, APIGatewayProxyResult, Handler } from 'aws-lambda';

type POSTAPIGatewayProxyEvent<S> = Omit<APIGatewayProxyEvent, 'body'> & { body: S };
export type EventPOSTAPIGatewayProxyEvent<S> = Handler<POSTAPIGatewayProxyEvent<S>, APIGatewayProxyResult>;

export type GETAPIGatewayProxyEvent<P = void, Q = void> = Omit<
    APIGatewayProxyEvent,
    'pathParameters' | 'queryStringParameters'
> & { pathParameters?: P; queryStringParameters?: Q };
export type EventGETAPIGatewayProxyEvent<P = void, Q = void> = Handler<
    GETAPIGatewayProxyEvent<P, Q>,
    APIGatewayProxyResult
>;
