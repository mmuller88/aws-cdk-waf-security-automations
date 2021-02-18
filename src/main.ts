import * as core from '@aws-cdk/core';
import { BuildPipelineStack } from './build-pipeline-stack';
import { GlobalDynamoDBStack } from './global-dynamodb-stack';

// for development, use account/region from cdk cli
const devEnv = {
  account: '981237193288',
  region: 'eu-central-1',
};

const prodEnv = {
  account: '991829251144',
  region: 'eu-central-1',
};

const app = new core.App();

const ddbDevStack = new GlobalDynamoDBStack(app, 'DdbDev2', { env: devEnv });
const ddbProdStack = new GlobalDynamoDBStack(app, 'DdbProd', { env: prodEnv });

new BuildPipelineStack(app, 'BuildPipelineStack', {
  env: devEnv,
  devStack: ddbDevStack,
  prodStack: ddbProdStack,
});

app.synth();