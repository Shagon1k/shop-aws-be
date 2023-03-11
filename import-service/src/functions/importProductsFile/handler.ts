import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { prepareResponse, checkIfOriginAllowed } from '@libs/api-gateway';
import { BaseError, BadRequestError } from '@libs/errors';
import { RESP_STATUS_CODES } from '@constants';
import { IMPORT_EXPIRATION_TIME } from '../../config';

import { type EventGETAPIGatewayProxyEvent } from '@types';

const { BUCKET_NAME = '', BUCKET_REGION = '', BUCKET_FOLDER_UPLOADED = 'uploaded' } = process.env;

const MSG_IMPORT_SIGNED_URL_CREATED = 'Import signed url created successfully!';
const MSG_INVALID_FILE_NAME = 'Invalid file name passed.';

const createS3Client = () =>
    new S3Client({
        region: BUCKET_REGION,
    });

const importProductsFile: EventGETAPIGatewayProxyEvent<any, { name: string }> = async (event) => {
    const requestOrigin = event.headers.origin || '';
    try {
        // CORS not allowed fast return
        if (!checkIfOriginAllowed(requestOrigin)) {
            return prepareResponse(
                {
                    message: 'Not allowed',
                },
                '',
                RESP_STATUS_CODES.FORBIDDEN
            );
        }

        // Request handle
        const newFileName = event.queryStringParameters?.name;
        console.log('Import products file lambda was triggered with file name passed: ', newFileName);

        if (typeof newFileName !== 'string' || !newFileName) {
            throw new BadRequestError(MSG_INVALID_FILE_NAME);
        }

        const s3Client = createS3Client();

        const signedUrl = await getSignedUrl(
            s3Client,
            new PutObjectCommand({
                Bucket: BUCKET_NAME,
                Key: `${BUCKET_FOLDER_UPLOADED}/${newFileName}`,
                ContentType: 'text/csv',
            }),
            { expiresIn: IMPORT_EXPIRATION_TIME }
        );

        console.log('Signed Url to import file created:', signedUrl);

        return prepareResponse(
            {
                message: MSG_IMPORT_SIGNED_URL_CREATED,
                data: signedUrl,
            },
            requestOrigin,
            RESP_STATUS_CODES.CREATED
        );
    } catch (error) {
        console.error('Error', error);

        if (error instanceof BaseError) {
            const { code, stack, message } = error;
            return prepareResponse({ stack, message }, requestOrigin, code);
        } else if (error instanceof Error) {
            const { message, stack } = error;
            return prepareResponse({ stack, message }, requestOrigin, RESP_STATUS_CODES.INTERNAL_ERROR);
        }

        return prepareResponse(
            { message: 'Internal server error.' },
            requestOrigin,
            RESP_STATUS_CODES.INTERNAL_ERROR
        );
    }
};

export default importProductsFile;
