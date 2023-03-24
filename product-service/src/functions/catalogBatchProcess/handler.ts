import { SQSClient, DeleteMessageCommand } from '@aws-sdk/client-sqs';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import getProductsDbController from '@libs/products-db-controller';
import { isValidCreateProductBody } from '@libs/is-valid-create-product-body';

import { type EventSQSEvent } from '@types';

const checkIsStarbucksCoffee = (productTitle: string) =>
    productTitle.toLocaleLowerCase().includes('starbucks');

export const MSG_PRODUCT_CREATED = 'Created new Coffee Shop product.';
export const MSG_INVALID_PRODUCT_DATA = 'Invalid new Coffee Shop product data.';

const catalogBatchProcess: EventSQSEvent = async (event) => {
    try {
        const recordsData = event.Records;
        console.log('Catalog batch process lambda triggered with event: ', event);

        // Request handle
        const sqsClient = new SQSClient({ region: process.env.REGION });
        const snsClient = new SNSClient({ region: process.env.REGION });

        for (let recordData of recordsData) {
            const { body, receiptHandle } = recordData;

            const createProductBody = JSON.parse(body);

            if (!isValidCreateProductBody(createProductBody)) {
                console.log(MSG_INVALID_PRODUCT_DATA);
                console.log('Product was not added!', createProductBody);
            } else {
                const createdData = await getProductsDbController().createProduct(createProductBody);

                console.log('Product was added successfully!', createdData);

                const isStarbucks = checkIsStarbucksCoffee(createdData.product.title);
                console.log(`Newly created coffee is ${isStarbucks ? '' : 'NOT'} a Starbucks one`);

                console.log('Sending email about newly created product to subscribers.');

                await snsClient.send(
                    new PublishCommand({
                        TopicArn: process.env.SNS_ARN,
                        Subject: 'New coffee was added!',
                        Message: `New coffee was added. Coffee info: ${JSON.stringify(createdData)}`,
                        MessageAttributes: {
                            is_starbucks: {
                                DataType: 'String',
                                StringValue: String(isStarbucks),
                            },
                        },
                    })
                );
                console.log('Sent successfully!');
            }

            // Note: As no more other SQS queue consumers, delete message in success/failure case
            console.log('Deleting new product message from the queue.');

            await sqsClient.send(
                new DeleteMessageCommand({
                    QueueUrl: process.env.SQS_URL,
                    ReceiptHandle: receiptHandle,
                })
            );
        }
    } catch (error) {
        console.error('Internal error ocurred', error);
    }
};

export default catalogBatchProcess;
