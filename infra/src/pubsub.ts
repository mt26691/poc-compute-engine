import * as pulumi from '@pulumi/pulumi';
import * as gcp from '@pulumi/gcp';
import { serviceName } from './server';

new gcp.pubsub.Topic(`${serviceName}-topic`, {
  name: serviceName,
});
