import * as pulumi from '@pulumi/pulumi';
import * as gcp from '@pulumi/gcp';
import { serviceName } from './server';

const topic = new gcp.pubsub.Topic(`${serviceName}-topic`, {
  name: serviceName,
});

const subscription = new gcp.pubsub.Subscription(
  `${serviceName}-subscription`,
  {
    topic: topic.name,
    enableExactlyOnceDelivery: true,
    enableMessageOrdering: true,
  },
);
