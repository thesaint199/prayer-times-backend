import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as lambdaNode from 'aws-cdk-lib/aws-lambda-nodejs';
import * as path from 'path';

export class PrayerTimesBackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const prayerLambda = new lambdaNode.NodejsFunction(this, 'PrayerTimesLambda', {
      entry: path.join(__dirname, '../lambda/prayer-times.ts'),
      handler: 'handler',
      runtime: cdk.aws_lambda.Runtime.NODEJS_20_X,
      bundling: {
        externalModules: [], // bundle everything, including 'adhan'
      },
    });

    const api = new apigw.RestApi(this, 'PrayerTimesApi', {
      restApiName: 'Prayer Times Service',
      description: 'ISNA daily + MWL fasting',
      deployOptions: {
        stageName: 'prod',
      },
    });

    const prayerResource = api.root.addResource('prayer-times');
    prayerResource.addMethod('GET', new apigw.LambdaIntegration(prayerLambda));

    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url ?? '',
    });
  }
}
