import * as cfn from '@aws-cdk/cloudformation-include';
import * as core from '@aws-cdk/core';

export interface WafStackProps extends core.StackProps {
  readonly WafCfnParameters: {
    /**
     * Name for access log bucket which will be created
     */
    readonly AppAccessLogBucket: string;
  };
}


export class WafStack extends core.Stack {
  constructor(scope: core.Construct, id: string, props: WafStackProps) {
    super(scope, id, props);

    // const logBucket = new s3.Bucket(this, 'logBucket', {
    //   removalPolicy: core.RemovalPolicy.DESTROY,
    //   autoDeleteObjects: true,
    // });

    new cfn.CfnInclude(this, 'waf', {
      templateFile: 'src/aws-waf-security-automations.template',
      parameters: props.WafCfnParameters,
    });
  }
}