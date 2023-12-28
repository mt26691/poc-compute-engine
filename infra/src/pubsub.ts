import * as gcp from '@pulumi/gcp';

const dlq = new gcp.pubsub.Topic('dlq-topic');

const dlqSubscription = new gcp.pubsub.Subscription('dlq-subscription', {
  topic: dlq.name,
});

export const topic = new gcp.pubsub.Topic('topic');

export const subscription = new gcp.pubsub.Subscription('subscription', {
  topic: topic.name,
  enableExactlyOnceDelivery: true,
  enableMessageOrdering: true,
  retryPolicy: {
    minimumBackoff: '3s',
    maximumBackoff: '5s',
  },
  filter: 'data.type = "LABEL_CREATED"',
  // deadLetterPolicy: {
  //   deadLetterTopic: dlq.id,
  //   maxDeliveryAttempts: 5,
  // },
});
