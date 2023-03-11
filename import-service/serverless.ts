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
        },
        iam: {
            role: {
                statements: [
                    {
                        /**
                         * Note: Needed for get pre-signed URLs as it's generated based on
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
                ],
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
