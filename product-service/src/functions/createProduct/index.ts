import { handlerPath } from '@libs/handler-resolver';
import swaggerConfig from '../../../swagger.json';

export default {
    handler: `${handlerPath(__dirname)}/handler.default`,
    events: [
        {
            http: {
                method: 'post',
                path: 'products',
                cors: true,
                request: {
                    schemas: {
                        'application/json': swaggerConfig.paths['/products'].post.requestBody.content['application/json'].schema
                    },
                },
            },
        },
    ],
};
