import importProductsFile, { MSG_IMPORT_SIGNED_URL_CREATED } from './handler';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { prepareResponse, checkIfOriginAllowed } from '@libs/api-gateway';
import { RESP_STATUS_CODES } from '@constants';

import { type Context, type Callback } from 'aws-lambda';

jest.mock('@libs/api-gateway');
jest.mock('@aws-sdk/client-s3');
jest.mock('@aws-sdk/s3-request-presigner')

describe('importProductsFile lambda', () => {
    describe('when request origin is NOT allowed', () => {
        beforeAll(() => {
            (checkIfOriginAllowed as jest.Mock).mockReturnValue(false);
        });

        it('should return not allowed CORS HTTP response', async () => {
            const mockedEvent = {
                headers: {
                    origin: 'some-origin',
                },
            } as any;

            await importProductsFile(mockedEvent, {} as Context, {} as Callback);

            expect(prepareResponse).toHaveBeenCalledWith(expect.any(Object), '', RESP_STATUS_CODES.FORBIDDEN);
        });
    });

    describe('when request origin is allowed', () => {
        beforeAll(() => {
            (checkIfOriginAllowed as jest.Mock).mockReturnValue(true);
        });

        describe('and "name" query parameter is incorrect or missed', () => {
            const incorrectEventQueryParamsArr = [
                {
                    dummy: 'dummy',
                },
                {
                    name: 42,
                },
                {},
            ];

            it.each(incorrectEventQueryParamsArr)(
                'should return HTTP Bad Request Error for %o query param',
                async (incorrectEventQueryParam) => {
                    const mockedEvent = {
                        headers: {
                            origin: 'some-origin',
                        },
                        queryStringParameters: incorrectEventQueryParam,
                    } as any;

                    await importProductsFile(mockedEvent, {} as Context, {} as Callback);

                    expect(prepareResponse).toHaveBeenCalledWith(
                        expect.any(Object),
                        'some-origin',
                        RESP_STATUS_CODES.BAD_REQUEST
                    );
                }
            );
        });

        describe('and "name" query parameter passed correctly', () => {
            const SAVED_ENV = process.env;
            const mockedBucketName = 'mockedBucketName';
            const mockedBucketRegion = 'mockedBucketRegion';
            const mockedUploadedFolder = 'mockedUploadedFolder';
            const mockedSignedUrl = 'mockedSignedUrl';

            beforeAll(() => {
                process.env = {
                    BUCKET_NAME: mockedBucketName,
                    REGION: mockedBucketRegion,
                    BUCKET_FOLDER_UPLOADED: mockedUploadedFolder,
                };
                (getSignedUrl as jest.Mock).mockResolvedValue(mockedSignedUrl);
            });

            afterAll(() => {
                process.env = SAVED_ENV;
            });

            it('should return presigned url for S3 client PutObject action', async () => {
                const mockedNewFileName = 'mock.csv';
                const mockedEvent = {
                    headers: {
                        origin: 'some-origin',
                    },
                    queryStringParameters: {
                        name: mockedNewFileName,
                    },
                } as any;

                await importProductsFile(mockedEvent, {} as Context, {} as Callback);

                expect(S3Client).toHaveBeenCalledWith({
                    region: mockedBucketRegion,
                });
                expect(PutObjectCommand).toHaveBeenCalledWith({
                    Bucket: mockedBucketName,
                    Key: `${mockedUploadedFolder}/${mockedNewFileName}`,
                    ContentType: 'text/csv',
                });
                expect(prepareResponse).toHaveBeenCalledWith(
                    {
                        message: MSG_IMPORT_SIGNED_URL_CREATED,
                        data: mockedSignedUrl,
                    },
                    'some-origin',
                    RESP_STATUS_CODES.CREATED
                );
            });
        });
    });
});
