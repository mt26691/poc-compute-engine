import * as gcp from '@pulumi/gcp';
import * as pulumi from '@pulumi/pulumi';

type RetryPolicy = {
  minimumBackoff: string;
  maximumBackoff: string;
};

type SubscribeTopicParams = {
  subscriber: string;
  publisher: string;
  topic: pulumi.Input<string>;
  pushEndpoint: pulumi.Output<string> | string;
  pubSubServiceAccountEmail?: pulumi.Output<string>;
  retryPolicy?: RetryPolicy;
  ackDeadlineSeconds?: number;
  maxDeliveryAttempts?: number;
};

const MAX_DELIVERY_ATTEMPTS = 5;
const ACK_DEADLINE_SECONDS = 20;
const RETRY_POLICY: RetryPolicy = {
  minimumBackoff: '1s',
  maximumBackoff: '3s',
};

export const subscribeTopic = (params: SubscribeTopicParams) => {
  const dlqTopic = new gcp.pubsub.Topic(
    `${params.subscriber}-sub-${params.publisher}-dlq-topic`,
  );

  const dlq = new gcp.pubsub.Subscription(
    `${params.subscriber}-sub-${params.publisher}-dlq`,
    {
      topic: dlqTopic.name,
    },
  );

  const sub = new gcp.pubsub.Subscription(
    `${params.subscriber}-sub-${params.publisher}`,
    {
      topic: params.topic,
      ackDeadlineSeconds: params.ackDeadlineSeconds ?? ACK_DEADLINE_SECONDS,
      pushConfig: {
        pushEndpoint: params.pushEndpoint,
      },
      retryPolicy: params.retryPolicy ?? RETRY_POLICY,
      deadLetterPolicy: {
        deadLetterTopic: dlqTopic.id,
        maxDeliveryAttempts:
          params.maxDeliveryAttempts ?? MAX_DELIVERY_ATTEMPTS,
      },
    },
  );

  // new gcp.pubsub.TopicIAMMember(
  //   `${params.resourcePrefix}-${params.subscriber}-sub-${params.publisher}-dlq-topic-iam-member`,
  //   {
  //     topic: dlqTopic.name,
  //     role: 'roles/pubsub.publisher',
  //     member: params.pubSubServiceAccountEmail,
  //   },
  // );

  // new gcp.pubsub.SubscriptionIAMMember(
  //   `${params.resourcePrefix}-${params.subscriber}-sub-${params.publisher}-sub-iam-member`,
  //   {
  //     subscription: sub.name,
  //     role: 'roles/pubsub.subscriber',
  //     member: params.pubSubServiceAccountEmail,
  //   },
  // );

  return {
    subName: sub.name,
    subTopic: sub.topic,
    dlqName: dlq.name,
    dlqTopic: dlq.topic,
  };
};
