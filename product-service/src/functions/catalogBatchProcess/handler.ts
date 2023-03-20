import { SQSClient, DeleteMessageCommand } from '@aws-sdk/client-sqs';
import getProductsDbController from '@libs/products-db-controller';
import { isValidCreateProductBody } from '@libs/is-valid-create-product-body';

import { type EventSQSEvent } from '@types';

const { SQS_REGION, SQS_URL } = process.env;

export const MSG_PRODUCT_CREATED = 'Created new Coffee Shop product.';
export const MSG_INVALID_PRODUCT_DATA = 'Invalid new Coffee Shop product data.';

const catalogBatchProcess: EventSQSEvent = async (event) => {
    try {
        const recordsData = event.Records;
        console.log('Catalog batch process lambda triggered with event: ', event);

        // Request handle
        const sqsClient = new SQSClient({ region: SQS_REGION });

        for (let recordData of recordsData) {
            const { body, receiptHandle } = recordData;

            const createProductBody = JSON.parse(body);

            if (!isValidCreateProductBody(createProductBody)) {
                console.log(MSG_INVALID_PRODUCT_DATA);
                console.log('Product was not added!', createProductBody);
            } else {
                const createdData = await getProductsDbController().createProduct(createProductBody);

                console.log('Product was added successfully!', createdData);
            }

            // Note: As no more other SQS queue consumers, delete message in success/failure case
            try {
                console.log('Deleting new product message from the queue.');

                await sqsClient.send(
                    new DeleteMessageCommand({
                        QueueUrl: SQS_URL,
                        ReceiptHandle: receiptHandle,
                    })
                );
            } catch (error) {
                console.error('Error new product message from queue: ', error);
            }
        }
    } catch (error) {
        console.error('Internal error ocurred', error);
    }
};

export default catalogBatchProcess;
