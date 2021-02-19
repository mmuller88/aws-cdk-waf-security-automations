import * as dynamodb from '@aws-cdk/aws-dynamodb';
import * as core from '@aws-cdk/core';

export class GlobalDynamoDBStack extends core.Stack {
  constructor(scope: core.Construct, id: string, props: core.StackProps = {}) {
    super(scope, id, props);

    new dynamodb.Table(this, 'Table', {
      // tableName: 'GlobalTable',
      removalPolicy: core.RemovalPolicy.DESTROY,
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      // replicationRegions: [
      //   'us-east-1',
      //   // 'us-east-2',
      // ],
    });

    // new CfnOutput(this, 'bla', {
    //   value: table.
    // })
  }
}