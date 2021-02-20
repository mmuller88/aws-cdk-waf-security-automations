import * as s3 from '@aws-cdk/aws-s3';
import * as core from '@aws-cdk/core';
import { WafSecurityAutomations } from './waf-security-automations';

export class WafStack extends core.Stack {
  constructor(scope: core.Construct, id: string, props: core.StackProps) {
    super(scope, id, props);

    const logBucket = new s3.Bucket(this, 'logBucket', {
      removalPolicy: core.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    new WafSecurityAutomations(this, 'waf-security-automations', {
      stackName: 'waf-security-automations',
      accessLogBucket: logBucket,
      options: {
        // See below
      },
    });
  }
}