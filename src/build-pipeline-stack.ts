// import * as cfn from '@aws-cdk/aws-cloudformation';
import * as codebuild from '@aws-cdk/aws-codebuild';
import * as codepipeline from '@aws-cdk/aws-codepipeline';
import * as codepipeline_actions from '@aws-cdk/aws-codepipeline-actions';
// import * as iam from '@aws-cdk/aws-iam';
import * as core from '@aws-cdk/core';
// import * as iam from '@aws-cdk/aws-iam';

export interface BuildPipelineStackProps extends core.StackProps {
  stackName: string;
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

    // const deployProject = new codebuild.PipelineProject(this, 'deployProject', createUpdateStackSpec(props.stack.stackName));
    // deployProject.addToRolePolicy(new iam.PolicyStatement({
    //   actions: ['*'], // cloudformation:DescribeStacks, ssm:GetParameter
    //   resources: ['*'],
    // }));

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
          stageName: 'Deploy',
          actions: [
            new codepipeline_actions.CloudFormationCreateUpdateStackAction({
              actionName: props.stackName,
              stackName: props.stackName,
              templatePath: cdkBuildOutput.atPath(`cdk.out/${props.stackName}.template.json`),
              adminPermissions: true,
              // role:
            }),
            // new codepipeline_actions.CodeBuildAction({
            //   actionName: `Deploy${props.stack.stackName}`,
            //   project: deployProject,
            //   input: cdkBuildOutput,
            // }),
          ],
        },
      ],
      restartExecutionOnUpdate: true,
    });
  }
}

// function createUpdateStackSpec(stackName: string) {
//   return {
//     buildSpec: codebuild.BuildSpec.fromObject({
//       version: '0.2',
//       phases: {
//         install: {
//           'runtime-versions': { nodejs: 12 },
//           'commands': ['npm i npm@latest -g', 'npm i cdk@latest -g', 'npm install'],
//         },
//         build: {
//           commands: [
//             `cdk deploy --app 'cdk.out/' ${stackName} --require-approval never`,
//           ],
//         },
//       },
//     }),
//     environment: {
//       buildImage: codebuild.LinuxBuildImage.AMAZON_LINUX_2_3,
//     },
//   };
// }