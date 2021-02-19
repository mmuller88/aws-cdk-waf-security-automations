# cdk-dynamodb-pipe-poc

That is a CDK CodePipeline for deploying a global DynamoDB.

# GitHub specifics

You need to put your GitHub Token in src/build-pipeline-stack.ts respectively to the used pipeline region e.g.:

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

# Troubleshooting

Don't forget to Bootstrap you region e.g.:

```
cdk bootstrap --trust 111111111 --force --cloudformation-execution-policies arn:aws:iam::aws:policy/AdministratorAccess aws://22222222/ca-central-1 --profile default
```

If you get:

```
1:22:28 PM | CREATE_FAILED        | AWS::CodePipeline::Pipeline | BuildPipelineB0A659C0
Internal Failure
```

check if the oauthToken: core.SecretValue.secretsManager( ... exist in the region where you deploy the pipeline to.

# Useful

Quick iterating with destroying and deploying the pipe

```
yes | yarn cdkDestroy 'BuildPipelineStack' && yarn cdkDeploy 'BuildPipelineStack' --require-approval never
```
