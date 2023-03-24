import catalogBatchProcess from './handler';
import { SQSClient, DeleteMessageCommand } from '@aws-sdk/client-sqs';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { isValidCreateProductBody } from '@libs/is-valid-create-product-body';

import { type SQSEvent, type Context, type Callback, type SQSRecord } from 'aws-lambda';

jest.mock('@aws-sdk/client-sqs');
jest.mock('@aws-sdk/client-sns');
jest.mock('@libs/is-valid-create-product-body');

const createProductMock = jest.fn((body) => ({
    product: body
}));
jest.mock('@libs/products-db-controller', () => ({
    __esModule: true,
    default: () => ({
        createProduct: createProductMock,
    }),
}));

describe('catalogBatchProcess lambda', () => {
    const SAVED_ENV = process.env;
    const mockedRegion = 'mockedRegion';
    const mockedSNSArn = 'mockedSNSArn';
    const mockedSQSUrl = 'mockedSQSUrl';

    beforeAll(() => {
        process.env = {
            REGION: mockedRegion,
            SNS_ARN: mockedSNSArn,
            SQS_URL: mockedSQSUrl,
        };
    });

    afterAll(() => {
        process.env = SAVED_ENV;
    });

    it('should create SQS and SNS client with passed region name', async () => {
        await catalogBatchProcess({} as SQSEvent, {} as Context, {} as Callback)

        expect(SQSClient).toHaveBeenCalledWith({
            region: mockedRegion,
        });

        expect(SNSClient).toHaveBeenCalledWith({
            region: mockedRegion,
        });
    });

    describe('when Queue event collects records', () => {
        const mockedEvent = {
            Records: [
                {
                    body: '{"title": "starbucks"}',
                    receiptHandle: 'mockedReceipt1',
                } as SQSRecord,
                {
                    body: '{"title": "mocked"}',
                    receiptHandle: 'mockedReceipt2',
                } as SQSRecord,
            ],
        };

        describe('and some product to create data invalid', () => {
            beforeAll(() => {
                (isValidCreateProductBody as unknown as jest.Mock).mockReturnValue(false);
            });

            it('should NOT create new product in DB and publish notifications', async () => {
                await catalogBatchProcess(mockedEvent, {} as Context, {} as Callback);

                expect(createProductMock).not.toHaveBeenCalled();
                expect(PublishCommand).not.toHaveBeenCalled();
            });
        });

        describe('and all products to create data is valid', () => {
            beforeAll(() => {
                (isValidCreateProductBody as unknown as jest.Mock).mockReturnValue(true);
            });


            it('should create products in DB and publish notifications based on filtering', async () => {
                await catalogBatchProcess(mockedEvent, {} as Context, {} as Callback);

                expect(createProductMock).toHaveBeenCalledTimes(2);
                expect(PublishCommand).toHaveBeenCalledWith({
                    TopicArn: mockedSNSArn,
                    Subject: expect.any(String),
                    Message: expect.any(String),
                    MessageAttributes: {
                        isStarbucks: {
                            DataType: 'String',
                            StringValue: 'false',
                        },
                    },
                });
                expect(PublishCommand).toHaveBeenCalledWith({
                    TopicArn: mockedSNSArn,
                    Subject: expect.any(String),
                    Message: expect.any(String),
                    MessageAttributes: {
                        isStarbucks: {
                            DataType: 'String',
                            StringValue: 'true',
                        },
                    },
                });
            });

            it('should delete messages from the queue after handling', async () => {
                await catalogBatchProcess(mockedEvent, {} as Context, {} as Callback);

                expect(DeleteMessageCommand).toHaveBeenCalledWith({
                    QueueUrl: mockedSQSUrl,
                    ReceiptHandle: 'mockedReceipt1',
                });
                expect(DeleteMessageCommand).toHaveBeenCalledWith({
                    QueueUrl: mockedSQSUrl,
                    ReceiptHandle: 'mockedReceipt2',
                });
            });
        });
    });
});
