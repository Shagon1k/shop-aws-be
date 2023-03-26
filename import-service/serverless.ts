import { importProductsFile, importFileParser } from '@functions';

import type { AWS } from '@serverless/typescript';

const serverlessConfiguration: AWS = {
    service: 'import-service',
    frameworkVersion: '3',
    // Note: sls-dotenv-plugin to inject env variables in functions automatically (w\o re-defining in 'environment')
    plugins: ['serverless-esbuild', 'serverless-dotenv-plugin'],
    // Note: to use env variables in config
    useDotenv: true,
    provider: {
        name: 'aws',
        runtime: 'nodejs14.x',
        region: 'eu-west-1',
        apiGateway: {
            minimumCompressionSize: 1024,
        },
        environment: {
            // Note: Alternatively, env variables could be re-defined here using only 'useDotenv', than sls-dotenv-plugin could be removed.
            AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
            NODE_OPTIONS: '--enable-source-maps --stack-trace-limit=1000',
            SQS_URL: '${cf:product-service-dev.SQSQueue}',
        },
        iam: {
            role: {
                statements: [
                    {
                        /**
                         * Note: Needed to get pre-signed URLs as it's generated based on
                         * the object's key, which requires listing the contents of the bucket.
                         */
                        Effect: 'Allow',
                        Action: ['s3:ListBucket'],
                        Resource: ['arn:aws:s3:::epam-course-products-import'],
                    },
                    {
                        Effect: 'Allow',
                        Action: ['s3:PutObject', 's3:GetObject', 's3:CopyObject', 's3:DeleteObject'],
                        Resource: ['arn:aws:s3:::epam-course-products-import/*'],
                    },
                    {
                        Effect: 'Allow',
                        Action: ['sqs:*'],
                        Resource: ['${cf:product-service-dev.SQSQueueArn}'],
                    },
                ],
            },
        },
    },
    resources: {
        Resources: {
            GatewayResponseDefault400: {
                Type: 'AWS::ApiGateway::GatewayResponse',
                Properties: {
                    ResponseParameters: {
                        'gatewayresponse.header.Access-Control-Allow-Origin': "'*'",
                        'gatewayresponse.header.Access-Control-Allow-Headers': "'*'",
                    },
                    ResponseType: 'DEFAULT_4XX',
                    RestApiId: { Ref: 'ApiGatewayRestApi' },
                },
            },
            GatewayResponseAccessDenied: {
                Type: 'AWS::ApiGateway::GatewayResponse',
                Properties: {
                    ResponseType: 'ACCESS_DENIED',
                    ResponseParameters: {
                        'gatewayresponse.header.Access-Control-Allow-Origin': "'*'",
                        'gatewayresponse.header.Access-Control-Allow-Headers': "'*'",
                    },
                    RestApiId: { Ref: 'ApiGatewayRestApi' },
                },
            },
            GatewayResponseUnauthorized: {
                Type: 'AWS::ApiGateway::GatewayResponse',
                Properties: {
                    ResponseType: 'UNAUTHORIZED',
                    ResponseParameters: {
                        'gatewayresponse.header.Access-Control-Allow-Origin': "'*'",
                        'gatewayresponse.header.Access-Control-Allow-Headers': "'*'",
                    },
                    RestApiId: { Ref: 'ApiGatewayRestApi' },
                    ResponseTemplates: {
                        'application/json': '{ "message": $context.error.messageString }',
                    },
                },
            },
            GatewayResponseDefault500: {
                Type: 'AWS::ApiGateway::GatewayResponse',
                Properties: {
                    RestApiId: { Ref: 'ApiGatewayRestApi' },
                    ResponseType: 'DEFAULT_5XX',
                    ResponseParameters: {
                        'gatewayresponse.header.Access-Control-Allow-Origin': "'*'",
                        'gatewayresponse.header.Access-Control-Allow-Headers': "'*'",
                    },
                    ResponseTemplates: {
                        'application/json': '{ "message": $context.error.messageString }',
                    },
                },
            },
            AuthFailureGatewayResponse: {
                Type: 'AWS::ApiGateway::GatewayResponse',
                Properties: {
                    ResponseParameters: {
                        'gatewayresponse.header.Access-Control-Allow-Origin': "'*'",
                        'gatewayresponse.header.Access-Control-Allow-Headers': "'*'",
                    },
                    ResponseType: 'UNAUTHORIZED',
                    RestApiId: { Ref: 'ApiGatewayRestApi' },
                    StatusCode: '401',
                },
            },
        },
    },
    // import the function via paths
    functions: {
        importProductsFile,
        importFileParser,
    },
    package: { individually: true },
    custom: {
        esbuild: {
            bundle: true,
            minify: false,
            sourcemap: true,
            exclude: ['aws-sdk'],
            target: 'node14',
            define: { 'require.resolve': undefined },
            platform: 'node',
            concurrency: 10,
        },
    },
};

module.exports = serverlessConfiguration;
