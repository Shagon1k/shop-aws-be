import { handlerPath } from '@libs/handler-resolver';

export default {
    handler: `${handlerPath(__dirname)}/handler.default`,
    events: [
        {
            sqs: {
                batchSize: 5,
                arn: {
                    'Fn::GetAtt': ['SQSQueue', 'Arn'],
                },
            },
        },
    ],
};
