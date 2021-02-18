# cdk-dynamodb-pipe-poc

# GitHub specifics

You need to put your GitHub Token in src/build-pipeline-stack.ts :

```ts
oauthToken: core.SecretValue.secretsManager('alfcdk', {
  jsonField: 'muller88-github-token',
}),
```

# AWS CDK

For deploy to AWS run:

```
yarn install
yarn deploy
```

For destroy run:

```
yarn destroy
```
