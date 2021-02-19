# cdk-dynamodb-pipe-poc

That is a CDK CodePipeline for deploying a global DynamoDB.

# GitHub specifics

You need to put your GitHub Token in src/build-pipeline-stack.ts :

```ts
oauthToken: core.SecretValue.secretsManager('alfcdk', {
  jsonField: 'muller88-github-token',
}),
```

# Pipeline

Deploy the pipeline with

```
yarn install
yarn cdkDeploy 'BuildPipelineStack'
```

For destroy run:

```
yarn cdkDeploy 'BuildPipelineStack'
```

The pipeline is not self mutating! A code change of the pipeline makes it necessary to deploy the pipeline again!

# Useful

Quick iterating with destroying and deploying the pipe

```
yes | yarn cdkDestroy 'BuildPipelineStack' && yarn cdkDeploy 'BuildPipelineStack' --require-approval never
```
