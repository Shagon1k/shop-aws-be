import { S3Client, GetObjectCommand, CopyObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import csvParser from 'csv-parser';
import { RESP_STATUS_CODES } from '@constants';

import { type EventS3Event } from '@types';

const {
    BUCKET_REGION = '',
    BUCKET_FOLDER_UPLOADED = 'uploaded',
    BUCKET_FOLDER_PARSED = 'parsed',
} = process.env;

const MSG_NO_RECORDS = 'No S3 records.';
const MSG_NO_READABLE_STREAM = 'No readable stream from S3 object.';
const MSG_ERROR_DURING_READ_STREAM = 'Error during stream read.';

const createS3Client = () =>
    new S3Client({
        region: BUCKET_REGION,
    });

const importFileParser: EventS3Event = async (event) => {
    try {
        const records = event.Records;
        const recordsLength = records.length;
        console.log('Import file parser lambda was triggered with records: ', records);

        if (recordsLength === 0) {
            throw new Error(MSG_NO_RECORDS);
        }

        const s3Client = createS3Client();
        const recordsParsePromises = records.map(async (record, recordIndex) => {
            const {
                s3: {
                    bucket: { name: bucketName },
                    object: { key: uploadedRecordKey },
                },
            } = record;

            const RECORD_INFO = `[RECORD ${recordIndex + 1} of ${recordsLength}]`;

            const s3StreamBody = (
                await s3Client.send(
                    new GetObjectCommand({
                        Bucket: bucketName,
                        Key: uploadedRecordKey,
                    })
                )
            ).Body;

            if (!(s3StreamBody instanceof Readable)) {
                throw new Error(`${RECORD_INFO} ${MSG_NO_READABLE_STREAM}`);
            }

            /**
             * Note: Alternatively could be rewritten to "await for...of" approach.
             * const parser = stream.pipe(csvParser()); => for await (const row of parser) {...}
             * Even though it increase readability, it decreases fine-grained control of
             * stream "end" and "error" handling + works slower for large amount of data.
             **/
            return new Promise((resolve, reject) => {
                s3StreamBody
                    .pipe(csvParser())
                    .on('data', (data) => {
                        // TODO: Will be handled in the next task
                        console.log(RECORD_INFO, `Parsing product import CSV data: `, data);
                    })
                    .on('error', (error) => {
                        console.error(RECORD_INFO, `Parsing error for product import CSV data: `, error);
                        // Note: This error will be handled on "catch" block
                        reject(new Error(`${RECORD_INFO} ${MSG_ERROR_DURING_READ_STREAM}`));
                    })
                    .on('end', async () => {
                        console.log(
                            RECORD_INFO,
                            `Product data parsed. Moving to "/parsed" folder has started.`
                        );

                        const parsedRecordKey = uploadedRecordKey.replace(
                            BUCKET_FOLDER_UPLOADED,
                            BUCKET_FOLDER_PARSED
                        );

                        // Copying from /uploaded to /parsed
                        console.log(
                            RECORD_INFO,
                            `Copying from ${bucketName}/${uploadedRecordKey} to ${bucketName}/${parsedRecordKey}.`
                        );
                        await s3Client.send(
                            new CopyObjectCommand({
                                CopySource: `${bucketName}/${uploadedRecordKey}`,
                                Bucket: bucketName,
                                Key: parsedRecordKey,
                            })
                        );
                        console.log(RECORD_INFO, 'Copied successfully!');

                        // Deleting from /uploaded
                        console.log(
                            RECORD_INFO,
                            `Deleting uploaded record from ${bucketName}/${uploadedRecordKey}`
                        );
                        await s3Client.send(
                            new DeleteObjectCommand({
                                Bucket: bucketName,
                                Key: uploadedRecordKey,
                            })
                        );
                        console.log(RECORD_INFO, 'Uploaded record deleted successfully!');

                        resolve('ok');
                    });
            });
        });

        await Promise.all(recordsParsePromises);

        return {
            statusCode: RESP_STATUS_CODES.ACCEPTED,
        };
    } catch (error) {
        console.error('Error', error);

        if (error instanceof Error) {
            const { message } = error;
            return {
                message,
                statusCode: RESP_STATUS_CODES.INTERNAL_ERROR,
            };
        }

        return {
            messages: 'Internal server error.',
            statusCode: RESP_STATUS_CODES.INTERNAL_ERROR,
        };
    }
};

export default importFileParser;
