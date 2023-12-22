import * as gcp from '@pulumi/gcp';
import { serviceName } from './server';

const topic = new gcp.pubsub.Topic(`${serviceName}-topic`, {
  name: serviceName,
});

export const subscription = new gcp.pubsub.Subscription(
  `${serviceName}-subscription`,
  {
    topic: topic.name,
    name: serviceName,
    enableExactlyOnceDelivery: true,
    enableMessageOrdering: true,
  },
);
