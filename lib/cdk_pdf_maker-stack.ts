import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { apiName, pdfMakerLambdaName } from './constants';
import path = require('path');
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import {
  Cors,
  CorsOptions,
  LambdaIntegration,
  ResourceOptions,
  RestApi,
} from 'aws-cdk-lib/aws-apigateway';
import { HTTP_METHOD } from '../src/lambdas/util';

export class CdkPdfMakerStack extends cdk.Stack {
  pdfMakerLambda: NodejsFunction;
  api: RestApi;
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.pdfMakerLambda = new NodejsFunction(this, pdfMakerLambdaName, {
      functionName: pdfMakerLambdaName,
      handler: 'handler',
      runtime: Runtime.NODEJS_20_X,
      entry: path.join(
        __dirname,
        '..',
        'src',
        'lambdas',
        'lambdaPDFMaker',
        'handler.ts'
      ),
      timeout: cdk.Duration.minutes(3),
    });

    this.pdfMakerLambda.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ['*'],
        resources: ['*'],
      })
    );

    this.api = new RestApi(this, apiName, {
      restApiName: apiName,
    });

    const corsOptions: ResourceOptions = {
      defaultCorsPreflightOptions: {
        allowOrigins: Cors.ALL_ORIGINS,
        allowMethods: Cors.ALL_METHODS,
      },
    };

    const apiResources = this.api.root.addResource('pdf', corsOptions);
    const apiPdfLambdaInt = new LambdaIntegration(this.pdfMakerLambda);
    apiResources.addMethod(HTTP_METHOD.POST, apiPdfLambdaInt);

    new cdk.CfnOutput(this, 'api_url', {
      value: this.api.url,
    });
  }
}
