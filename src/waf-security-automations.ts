// eslint-disable-next-line @typescript-eslint/no-require-imports
import path = require('path');
import * as iam from '@aws-cdk/aws-iam';
import * as lambda from '@aws-cdk/aws-lambda';
import * as lambdaJs from '@aws-cdk/aws-lambda-nodejs';
import * as s3 from '@aws-cdk/aws-s3';
import * as cdk from '@aws-cdk/core';
import * as cr from '@aws-cdk/custom-resources';

const optionsDefaults = {
  templateVersion: 'v3.1.0',
  activateSqlInjectionProtection: true,
  activateCrossSiteScriptingProtection: true,
  activateHttpFloodProtection: true,
  httpFloodProtectionMethod: 'waf',
  activateScannersProbesProtection: true,
  scannersProbesProtectionMethod: 'lambda',
  activateReputationListsProtection: true,
  activateBadBotProtection: true,
  endpointType: 'cloudfront',
  requestThresholdPerFiveMinutes: 100,
  errorThresholdPerMinute: 50,
  wafBlockPeriodMinutes: 240,
  keepDataInOriginalS3Location: false,
};

interface WafSecurityAutomationsOptions {
  readonly templateVersion: string;
  readonly activateSqlInjectionProtection?: boolean;
  readonly activateCrossSiteScriptingProtection?: boolean;
  readonly activateHttpFloodProtection?: boolean;
  readonly httpFloodProtectionMethod?: 'waf' | 'lambda' | 'athena';
  readonly activateScannersProbesProtection?: boolean;
  readonly scannersProbesProtectionMethod?: 'lambda' | 'athena';
  readonly activateReputationListsProtection?: boolean;
  readonly activateBadBotProtection?: boolean;
  readonly endpointType?: 'cloudfront' | 'alb';
  readonly requestThresholdPerFiveMinutes?: number;
  readonly errorThresholdPerMinute?: number;
  readonly wafBlockPeriodMinutes?: number;
  readonly keepDataInOriginalS3Location?: boolean;
}

export interface WafSecurityAutomationsProps {
  readonly options?: Partial<WafSecurityAutomationsOptions>;
  readonly accessLogBucket: s3.IBucket;
  readonly stackName: string;
}


export class WafSecurityAutomations extends cdk.Construct {
  readonly accessLogBucket: s3.IBucket;
  readonly stackName: string;
  readonly resource: cdk.CustomResource;
  readonly webAclName: string;
  readonly webAclArn: string;
  readonly webAclId: string;
  readonly webAclDescription: string;

  constructor(scope: cdk.Construct, id: string, props: WafSecurityAutomationsProps) {
    super(scope, id);
    var _a, _b;

    this.accessLogBucket = props.accessLogBucket;
    this.stackName = (_a = props.stackName) !== null && _a !== void 0 ? _a : 'AWSWafSecurityAutomations';
    const options = {
      ...optionsDefaults,
      ...((_b = props.options) !== null && _b !== void 0 ? _b : {}),
    };
    const providerFunctionShared = {
      entry: path.join(__dirname, 'provider', 'index.ts'),
      runtime: lambda.Runtime.NODEJS_12_X,
      timeout: cdk.Duration.minutes(15),
      initialPolicy: [
        new iam.PolicyStatement({
          resources: ['*'],
          actions: ['*'],
        }),
      ],
    };
    const onEventHandler = new lambdaJs.NodejsFunction(this, 'waf-automations-event', {
      ...providerFunctionShared,
      handler: 'onEvent',
    });
    // const isCompleteHandler = new lambdaJs.NodejsFunction(this, 'waf-automations-complete', {
    //   ...providerFunctionShared,
    //   handler: 'isComplete',
    // });
    const provider = new cr.Provider(this, 'waf-automations-provider', {
      onEventHandler,
      // isCompleteHandler,
    });
    this.resource = new cdk.CustomResource(this, 'waf-automations', {
      serviceToken: provider.serviceToken,
      properties: {
        StackName: this.stackName,
        //AccessLogBucketName: this.accessLogBucket.bucketName,
        TemplateVersion: options.templateVersion,
        Options: JSON.stringify(options),
      },
    });
    this.webAclName = this.resource.getAttString('WebAclName');
    this.webAclArn = this.resource.getAttString('WebAclArn');
    this.webAclId = this.resource.getAttString('WebAclId');
    this.webAclDescription = this.resource.getAttString('WebAclDescription');
  }
}