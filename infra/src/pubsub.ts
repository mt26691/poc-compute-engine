import * as gcp from '@pulumi/gcp';

const dlq = new gcp.pubsub.Topic('dlq-topic');

new gcp.pubsub.Subscription('dlq-sub', {
  topic: dlq.name,
});

export const mainTopic = new gcp.pubsub.Topic('main-topic');

export const mainSub = new gcp.pubsub.Subscription('main-sub', {
  topic: mainTopic.name,
  enableExactlyOnceDelivery: true,
  enableMessageOrdering: true,
  retryPolicy: {
    minimumBackoff: '3s',
    maximumBackoff: '5s',
  },
  deadLetterPolicy: {
    deadLetterTopic: dlq.id,
    maxDeliveryAttempts: 5,
  },
});
