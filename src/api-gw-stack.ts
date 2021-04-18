import * as apigateway from '@aws-cdk/aws-apigateway';
import * as waf from '@aws-cdk/aws-wafv2';
import * as core from '@aws-cdk/core';

export interface ApiGWStackProps extends core.StackProps {
  readonly wafWebAclArn: string;
}


export class ApiGWStack extends core.Stack {

  // wafWebAclArn: string;
  // const output: core.CfnOutput

  constructor(scope: core.Construct, id: string, props: ApiGWStackProps) {
    super(scope, id, props);

    const api = new apigateway.RestApi(this, 'books-api', {
      endpointConfiguration: {
        types: [apigateway.EndpointType.REGIONAL],
      },
    });

    const method = api.root.addMethod('ANY');
    method;

    const acl = new waf.CfnWebACLAssociation(this, 'wafAclAssociation', {
      resourceArn: `arn:aws:apigateway:${this.region}::/restapis/${api.restApiId}/stages/prod`,
      webAclArn: props.wafWebAclArn,
    });

    acl.node.addDependency(api);
  }
}