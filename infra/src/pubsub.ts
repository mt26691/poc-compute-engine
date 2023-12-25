import * as gcp from '@pulumi/gcp';

export const topic = new gcp.pubsub.Topic('topic');

export const subscription = new gcp.pubsub.Subscription('subscription', {
  topic: topic.name,
  enableExactlyOnceDelivery: true,
  enableMessageOrdering: true,
});
