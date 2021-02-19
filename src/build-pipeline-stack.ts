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
          files: [
            'cdk.out/**/*',
          ],
        },
      }),
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_3_0,
      },
    });

    const sourceOutput = new codepipeline.Artifact();
    const cdkBuildOutput = new codepipeline.Artifact('CdkBuildOutput');

    const deployDevProject = new codebuild.PipelineProject(this, 'updateStackDev', createUpdateStackSpec(props.devStack.stackName));
    deployDevProject.addToRolePolicy(new iam.PolicyStatement({
      actions: ['*'], // cloudformation:DescribeStacks, ssm:GetParameter
      resources: ['*'],
    }));

    const deployProdProject = new codebuild.PipelineProject(this, 'updateStackProd', createUpdateStackSpec(props.prodStack.stackName));
    deployProdProject.addToRolePolicy(new iam.PolicyStatement({
      actions: ['*'], // cloudformation:DescribeStacks, ssm:GetParameter
      resources: ['*'],
    }));

    new codepipeline.Pipeline(this, 'BuildPipeline', {
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
        // I saw that in the web about self mutating the pipeline. But please don't use it or be very causes.
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
          stageName: 'Dev',
          actions: [
            new codepipeline_actions.CodeBuildAction({
              actionName: `Deploy${props.devStack.stackName}`,
              project: deployDevProject,
              input: cdkBuildOutput,
            }),
          ],
        },
        {
          stageName: 'Prod',
          actions: [
            new codepipeline_actions.CodeBuildAction({
              actionName: `Deploy${props.prodStack.stackName}`,
              project: deployProdProject,
              input: cdkBuildOutput,
            }),
          ],
        },
      ],
      restartExecutionOnUpdate: true,
    });
  }
}

function createUpdateStackSpec(stackName: string) {
  return {
    buildSpec: codebuild.BuildSpec.fromObject({
      version: '0.2',
      phases: {
        install: {
          'runtime-versions': { nodejs: 12 },
          'commands': ['npm i npm@latest -g', 'npm i cdk@latest -g', 'npm install'],
        },
        build: {
          commands: [
            `cdk deploy --app 'cdk.out/' ${stackName} --require-approval never`,
          ],
        },
      },
    }),
    environment: {
      buildImage: codebuild.LinuxBuildImage.STANDARD_3_0,
    },
  };
}