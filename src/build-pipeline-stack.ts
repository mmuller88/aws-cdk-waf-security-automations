import * as codebuild from '@aws-cdk/aws-codebuild';
import * as codepipeline from '@aws-cdk/aws-codepipeline';
import * as codepipeline_actions from '@aws-cdk/aws-codepipeline-actions';
import * as core from '@aws-cdk/core';

export interface BuildPipelineStackProps extends core.StackProps {
  wafStackName: string;
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
        buildImage: codebuild.LinuxBuildImage.AMAZON_LINUX_2_3,
      },
    });

    const sourceOutput = new codepipeline.Artifact();
    const cdkBuildOutput = new codepipeline.Artifact('CdkBuildOutput');

    new codepipeline.Pipeline(this, 'BuildPipeline', {
      stages: [
        {
          stageName: 'Source',
          actions: [
            new codepipeline_actions.GitHubSourceAction({
              owner: 'mmuller88',
              repo: 'aws-cdk-waf-security-automations',
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
        {
          stageName: 'Deploy',
          actions: [
            new codepipeline_actions.CloudFormationCreateUpdateStackAction({
              actionName: props.wafStackName,
              stackName: props.wafStackName,
              templatePath: cdkBuildOutput.atPath(`cdk.out/${props.wafStackName}.template.json`),
              adminPermissions: true,
            }),
          ],
        },
      ],
      restartExecutionOnUpdate: true,
    });
  }
}