#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { PrayerTimesBackendStack } from '../lib/prayer-times-backend-stack';

const app = new cdk.App();
new PrayerTimesBackendStack(app, 'PrayerTimesBackendStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
