import type { APIGatewayProxyEvent, APIGatewayProxyResult, Handler, S3Event } from 'aws-lambda';

type GETAPIGatewayProxyEvent<P = void, Q = void> = Omit<
    APIGatewayProxyEvent,
    'pathParameters' | 'queryStringParameters'
> & { pathParameters?: P; queryStringParameters?: Q };
export type EventGETAPIGatewayProxyEvent<P = void, Q = void> = Handler<
    GETAPIGatewayProxyEvent<P, Q>,
    APIGatewayProxyResult
>;

export type EventS3EventResult = {
    statusCode: string | number,
    message?: string
}

export type EventS3Event = Handler<S3Event, EventS3EventResult>;
