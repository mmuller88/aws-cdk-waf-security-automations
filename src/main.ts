import * as core from '@aws-cdk/core';
import { BuildPipelineStack } from './build-pipeline-stack';
import { WafStack } from './waf-stack';


const env = {
  account: '981237193288',
  region: 'eu-central-1',
};

const app = new core.App();

const wafStack = new WafStack(app, 'waf', { env: env });

new BuildPipelineStack(app, 'WafPipe', {
  env: env,
  stack: wafStack,
});

app.synth();