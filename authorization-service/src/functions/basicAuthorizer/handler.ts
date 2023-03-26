import { type APIGatewayTokenAuthorizerHandler } from 'aws-lambda';

const AUTH_EFFECTS = {
    ALLOW: 'Allow',
    DENY: 'Deny',
} as const;

const MSG_INVALID_CREDS_PATTERN =
    'Forbidden. Invalid credentials pattern used. Required is username:password';

const checkCredsPatternValid = (creds: string) => /(.+):(.+)/.test(creds);
const checkCredsValid = (username: string, password: string) => {
    const correctPassword = process.env[username];

    return correctPassword === password;
};
const generatePolicy = (
    principalId: string,
    resource: string,
    authorizerEffect: (typeof AUTH_EFFECTS)[keyof typeof AUTH_EFFECTS]
) => {
    return {
        principalId,
        policyDocument: {
            Version: '2012-10-17',
            Statement: [
                {
                    Action: 'execute-api:Invoke',
                    Resource: [resource],
                    Effect: authorizerEffect,
                },
            ],
        },
    };
};

const basicAuthorizer: APIGatewayTokenAuthorizerHandler = async (event) => {
    const { authorizationToken, methodArn } = event;
    const [, passedToken] = authorizationToken.split(' ');

    console.log('Basic authorizer lambda was triggered with token: ', authorizationToken);

    const decodedCredentials = Buffer.from(passedToken, 'base64').toString('utf-8');

    if (!checkCredsPatternValid(decodedCredentials)) {
        throw new Error(MSG_INVALID_CREDS_PATTERN);
    }

    const [username, password] = decodedCredentials.split(':');
    console.log(`Credentials for ${username} passed correct.`);

    const isCredsValue = checkCredsValid(username, password);
    return generatePolicy(passedToken, methodArn, isCredsValue ? AUTH_EFFECTS.ALLOW : AUTH_EFFECTS.DENY);
};

export default basicAuthorizer;
