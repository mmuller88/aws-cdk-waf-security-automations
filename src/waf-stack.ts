import * as cfn from '@aws-cdk/cloudformation-include';
import * as core from '@aws-cdk/core';

export interface WafStackProps extends core.StackProps {
  // readonly WafCfnParameters: {
  //   /**
  //    * Name for access log bucket which will be created
  //    */
  //   readonly AppAccessLogBucket: string;
  // };
}


export class WafStack extends core.Stack {
  wafWebAclArn: core.CfnOutput;
  wafWebAcl: core.CfnOutput;

  constructor(scope: core.Construct, id: string, props: WafStackProps) {
    super(scope, id, props);

    const cfnTemplate = new cfn.CfnInclude(this, 'waf', {
      templateFile: 'src/aws-waf-security-automations.yaml',
      parameters:
      {
        AppAccessLogBucket: 'mmwafbucket',
        EndpointType: 'ALB',
      },
    });

    this.wafWebAclArn = cfnTemplate.getOutput('WAFWebACLArn');
    this.wafWebAcl = cfnTemplate.getOutput('WAFWebACL');
  }
}