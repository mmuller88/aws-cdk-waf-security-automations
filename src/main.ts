import * as core from '@aws-cdk/core';
import { BuildPipelineStack } from './build-pipeline-stack';
import { GlobalDynamoDBStack } from './global-dynamodb-stack';


const buildEnv = {
  account: '981237193288',
  region: 'ca-central-1',
};

const devEnv = {
  account: '981237193288',
  region: 'us-east-1',
};

const prodEnv = {
  account: '991829251144',
  region: 'us-east-1',
};

const app = new core.App();

const ddbDevStack = new GlobalDynamoDBStack(app, 'DdbDev3', { env: devEnv });
const ddbProdStack = new GlobalDynamoDBStack(app, 'DdbProd', { env: prodEnv });

new BuildPipelineStack(app, 'BuildPipelineStack', {
  env: buildEnv,
  devStack: ddbDevStack,
  prodStack: ddbProdStack,
});

app.synth();