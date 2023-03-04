import { getProductsList, getProductById, createProduct } from '@functions';

import type { AWS } from '@serverless/typescript';

const serverlessConfiguration: AWS = {
    service: 'product-service',
    frameworkVersion: '3',
    plugins: ['serverless-esbuild', 'serverless-dotenv-plugin'],
    provider: {
        name: 'aws',
        runtime: 'nodejs14.x',
        region: 'eu-west-1',
        apiGateway: {
            minimumCompressionSize: 1024,
        },
        environment: {
            AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
            NODE_OPTIONS: '--enable-source-maps --stack-trace-limit=1000',
        },
        iam: {
            role: {
                statements: [
                    {
                        Effect: 'Allow',
                        Action: ['dynamodb:*'],
                        Resource: [
                            'arn:aws:dynamodb:eu-west-1:739296314197:table/coffee-shop-products',
                            'arn:aws:dynamodb:eu-west-1:739296314197:table/coffee-shop-stocks',
                            'arn:aws:dynamodb:eu-west-1:739296314197:table/coffee-shop-stocks/index/product_id-index',
                        ],
                    },
                ],
            },
        },
    },
    functions: {
        getProductsList,
        getProductById,
        createProduct,
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
