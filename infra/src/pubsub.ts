import * as gcp from '@pulumi/gcp';

const dlq = new gcp.pubsub.Topic('dlq');

const dlqSubscription = new gcp.pubsub.Subscription('dlq-subscription', {
  topic: dlq.name,
});

export const topic = new gcp.pubsub.Topic('topic');

export const subscription = new gcp.pubsub.Subscription('subscription', {
  topic: topic.name,
  enableExactlyOnceDelivery: true,
  enableMessageOrdering: true,
  deadLetterPolicy: {
    deadLetterTopic: dlq.name,
  },
});
