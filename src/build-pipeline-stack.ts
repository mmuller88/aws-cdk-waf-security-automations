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
          // 'base-directory': 'cdk.out',
          files: [
            'cdk.out/**/*',
            // `${this.stackName}.template.json`,
            // `${props.devStack.stackName}.template.json`,
            // `${props.prodStack.stackName}.template.json`,
          ],
        },
      }),
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_3_0,
      },
    });

    const sourceOutput = new codepipeline.Artifact();
    const cdkBuildOutput = new codepipeline.Artifact('CdkBuildOutput');

    const deployProject = new codebuild.PipelineProject(this, 'updateStackDev', updateStack(props.devStack.stackName));
    deployProject.addToRolePolicy(new iam.PolicyStatement({
      actions: ['cloudformation:DescribeStacks'],
      resources: ['*'],
    }));

    const deploy = new codepipeline_actions.CodeBuildAction({
      actionName: `${props.devStack.stackName}`,
      project: deployProject,
      input: cdkBuildOutput,
    });

    const pipelineRole = new iam.Role(this, 'DeployRole', {
      assumedBy: new iam.ServicePrincipal('codepipeline.amazonaws.com'),
      //managedPolicies: [iam.ManagedPolicy.fromAwsManagedPolicyName('AdministratorAccess')],
    });

    pipelineRole.addToPolicy(new iam.PolicyStatement({
      actions: ['*'],
      resources: ['*'],
    }));

    new codepipeline.Pipeline(this, 'BuildPipeline', {
      // role: pipelineRole,
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
          stageName: 'DeployDev',
          actions: [
            deploy,
          ],
        },
      ],
      restartExecutionOnUpdate: true,
    });

    // workaround https://stackoverflow.com/questions/63659802/cannot-assume-role-by-code-pipeline-on-code-pipeline-action-aws-cdk
    // Altering cloudformation to remove role arn from actions
    //   const pipelineCfn = pipeline.node.defaultChild as core.CfnResource;
    //   // addDeletionOverride  removes the property from the cloudformation itself
    //   // Delete action arn for every stage and action created
    //   pipelineCfn.addDeletionOverride('Properties.Stages.1.Actions.0.RoleArn');
    //   pipelineCfn.addDeletionOverride('Properties.Stages.2.Actions.0.RoleArn');
    //   pipelineCfn.addDeletionOverride('Properties.Stages.3.Actions.0.RoleArn');
  }
}

function updateStack(stackName: string) {
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
            `cdk deploy --app 'cdk.out/' ${stackName} --require-approval never`, //--cloudformation-execution-policies arn:aws:iam::aws:policy/AdministratorAccess`,
          ],
        },
      },
    }),
    environment: {
      buildImage: codebuild.LinuxBuildImage.STANDARD_3_0,
    },
  };
}