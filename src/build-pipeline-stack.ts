import * as codebuild from '@aws-cdk/aws-codebuild';
import * as codepipeline from '@aws-cdk/aws-codepipeline';
import * as codepipeline_actions from '@aws-cdk/aws-codepipeline-actions';
import * as iam from '@aws-cdk/aws-iam';
import * as core from '@aws-cdk/core';

export interface BuildPipelineStackProps extends core.StackProps {
  devStack: core.Stack;
  prodStack: core.Stack;
}

export class BuildPipelineStack extends core.Stack {
  constructor(scope: core.Construct, id: string, props: BuildPipelineStackProps) {
    super(scope, id, props);

    const cdkBuild = new codebuild.PipelineProject(this, 'CdkBuild', {
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            'runtime-versions': { nodejs: 12 },
            'commands': ['npm i npm@latest -g', 'npm install'],
          },
          build: {
            commands: ['npm run build', 'npm run synth'],
          },
        },
        artifacts: {
          'base-directory': 'cdk.out',
          'files': [
            `${this.stackName}.template.json`,
            `${props.devStack.stackName}.template.json`,
            `${props.prodStack.stackName}.template.json`,
          ],
        },
      }),
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_3_0,
      },
    });

    const sourceOutput = new codepipeline.Artifact();
    const cdkBuildOutput = new codepipeline.Artifact('CdkBuildOutput');

    const updateStack = new codepipeline_actions.CloudFormationCreateUpdateStackAction({
      actionName: `${props.devStack.stackName}`,
      account: props.devStack.account,
      templatePath: cdkBuildOutput.atPath(`${props.devStack.stackName}.template.json`),
      stackName: props.devStack.stackName,
      region: props.devStack.region,
      adminPermissions: true,
    });

    const cp = new codepipeline.Pipeline(this, 'BuildPipeline', {
      stages: [
        {
          stageName: 'Source',
          actions: [
            new codepipeline_actions.GitHubSourceAction({
              owner: 'mmuller88',
              repo: 'cdk-dynamodb-pipe-poc',
              branch: 'main',
              output: sourceOutput,
              actionName: 'GitHubSource',
              oauthToken: core.SecretValue.secretsManager('alfcdk', {
                jsonField: 'muller88-github-token',
              }),
              trigger: codepipeline_actions.GitHubTrigger.WEBHOOK,
            }),
          ],
        },
        {
          stageName: 'Build',
          actions: [
            new codepipeline_actions.CodeBuildAction({
              actionName: 'CDK_Build',
              project: cdkBuild,
              input: sourceOutput,
              outputs: [cdkBuildOutput],
            }),
          ],
        },
        // {
        //   stageName: 'UpdatePipeline',
        //   actions: [
        //     new codepipeline_actions.CloudFormationCreateUpdateStackAction({
        //       actionName: 'AdministerPipeline',
        //       templatePath: cdkBuildOutput.atPath(`${this.stackName}.template.json`),
        //       stackName: this.stackName,
        //       adminPermissions: true,
        //     }),
        //   ],
        // },
        {
          stageName: 'DeployDev',
          actions: [
            updateStack,
          ],
        },
        // {
        //   stageName: 'DeployProd',
        //   actions: [
        //     new codepipeline_actions.CloudFormationCreateUpdateStackAction({
        //       actionName: `${props.prodStack.stackName}`,
        //       account: props.prodStack.account,
        //       templatePath: cdkBuildOutput.atPath(`${props.prodStack.stackName}.template.json`),
        //       stackName: props.prodStack.stackName,
        //       region: props.prodStack.region,
        //       adminPermissions: true,
        //     }),
        //   ],
        // },
      ],
      restartExecutionOnUpdate: true,
    });

    updateStack.addToDeploymentRolePolicy(new iam.PolicyStatement({
      actions: ['*'],
      resources: ['*'],
    }));

    cp.addToRolePolicy(new iam.PolicyStatement({
      actions: ['*'],
      resources: ['*'],
    }));
  }
}