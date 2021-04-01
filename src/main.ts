import * as core from '@aws-cdk/core';
import { BuildPipelineStack } from './build-pipeline-stack';
import { WafStack } from './waf-stack';


const env = {
  account: '981237193288',
  region: 'us-east-1',
};

const app = new core.App();

const wafStack = new WafStack(app, 'waf', {
  env: env,
  WafCfnParameters: {
    AppAccessLogBucket: 'mmwafbucket',
  },
});

new BuildPipelineStack(app, 'WafPipe2', {
  env: env,
  wafStackName: wafStack.stackName,
});

app.synth();