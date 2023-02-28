# Product Service AWS Shop (Aliaksei Hurynovich)

### Locally

In order to test the 'getProductById' function locally, run the following command:

- `npx sls invoke local -f getProductById --path src/functions/getProductById/mock.json` if you're using NPM
- `yarn sls invoke local -f getProductById --path src/functions/getProductById/mock.json` if you're using Yarn

Check the [sls invoke local command documentation](https://www.serverless.com/framework/docs/providers/aws/cli-reference/invoke-local/) for more information.

### Advanced usage

Any tsconfig.json can be used, but if you do, set the environment variable `TS_NODE_CONFIG` for building the application, eg `TS_NODE_CONFIG=./tsconfig.app.json npx serverless webpack`
