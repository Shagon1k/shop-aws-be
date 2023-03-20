import { getProductsList, getProductById, createProduct, catalogBatchProcess } from '@functions';

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
            SQS_URL: {
                Ref: 'SQSQueue',
            },
            SNS_ARN: {
                /**
                 * Note: If your SNS topic doesn't yet exist but is defined in the serverless.ts
                 * file you're editing, you'll need to use Fn::Ref or !Ref to get the ARN.
                 */
                Ref: 'SNSTopic',
            },
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
                    {
                        Effect: 'Allow',
                        Action: ['sqs:*'],
                        Resource: [
                            {
                                'Fn::GetAtt': ['SQSQueue', 'Arn'],
                            },
                        ],
                    },
                    {
                        Effect: 'Allow',
                        Action: ['sns:*'],
                        Resource: [
                            {
                                Ref: 'SNSTopic',
                            },
                        ],
                    },
                ],
            },
        },
    },
    resources: {
        Resources: {
            SQSQueue: {
                Type: 'AWS::SQS::Queue',
                Properties: {
                    QueueName: 'catalogItemsQueue',
                },
            },
            SNSTopic: {
                Type: 'AWS::SNS::Topic',
                Properties: {
                    TopicName: 'CreateProductTopic',
                },
            },
            SubscriptionIsStarbucks: {
                Type: 'AWS::SNS::Subscription',
                Properties: {
                    Endpoint: 'shagon1k@gmail.com',
                    Protocol: 'email',
                    TopicArn: {
                        Ref: 'SNSTopic',
                    },
                    FilterPolicy: {
                        isStarbucks: ['true']
                    },
                },
            },
            SubscriptionIsNotStarbucks: {
                Type: 'AWS::SNS::Subscription',
                Properties: {
                    Endpoint: 'shagon2k@gmail.com',
                    Protocol: 'email',
                    TopicArn: {
                        Ref: 'SNSTopic',
                    },
                },
            },
        },
        Outputs: {
            SQSQueueArn: {
                Value: {
                    'Fn::GetAtt': ['SQSQueue', 'Arn'],
                },
            },
            SQSQueue: {
                Value: {
                    Ref: 'SQSQueue',
                },
            },
        },
    },
    functions: {
        getProductsList,
        getProductById,
        createProduct,
        catalogBatchProcess,
    },
    package: { individually: true },
    custom: {
        esbuild: {
            bundle: true,
            minify: false,
            sourcemap: true,
            exclude: ['aws-sdk', 'pg-native'],
            target: 'node14',
            define: { 'require.resolve': undefined },
            platform: 'node',
            concurrency: 10,
        },
    },
};

module.exports = serverlessConfiguration;
