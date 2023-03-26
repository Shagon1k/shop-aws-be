import { handlerPath } from '@libs/handler-resolver';

export default {
    handler: `${handlerPath(__dirname)}/handler.default`,
    events: [
        {
            http: {
                method: 'get',
                path: 'import',
                cors: true,
                request: {
                    parameters: {
                        querystrings: {
                            name: true
                        }
                    }
                },
                authorizer: {
                    name: 'basicAuthorizer',
                    arn: '${cf:authorization-service-dev.BasicAuthorizerLambdaFunctionQualifiedArn}',
                    identitySource: 'method.request.header.Authorization',
                    type: 'token',
                    identityValidationExpression: 'Basic [A-Za-z0-9+/=]+'
                }
            },
        },
    ],
};
