const { AwsCdkTypeScriptApp } = require('projen');

const deps = [
  'aws-lambda',
  '@types/aws-lambda',
  'aws-sdk',
  'esbuild@^0',
];

const project = new AwsCdkTypeScriptApp({
  authorAddress: 'damadden88@googlemail.de',
  authorName: 'martin.mueller',
  cdkVersion: '1.90.1',
  defaultReleaseBranch: 'main',
  jsiiFqn: 'projen.AwsCdkTypeScriptApp',
  name: 'cdk-dynamodb-pipe-poc',
  cdkDependencies: [
    '@aws-cdk/aws-lambda',
    // '@aws-cdk/aws-lambda-nodejs',
    '@aws-cdk/custom-resources',
    '@aws-cdk/aws-codebuild',
    '@aws-cdk/aws-iam',
    '@aws-cdk/aws-codepipeline',
    '@aws-cdk/aws-codepipeline-actions',
    '@aws-cdk/aws-s3',
    '@aws-cdk/aws-cloudformation',
  ],
  deps: deps,
  devDeps: deps,
  context: {
    '@aws-cdk/core:enableStackNameDuplicates': true,
    'aws-cdk:enableDiffNoFail': true,
    '@aws-cdk/core:stackRelativeExports': true,
    '@aws-cdk/core:newStyleStackSynthesis': true,
  },
  keywords: [
    'cdk',
    'aws',
    'dynamodb',
    'codepipeline',
  ],
});

project.setScript('cdkDeploy', 'tsc && cdk deploy');
project.setScript('cdkDestroy', 'cdk destroy');

project.synth();
