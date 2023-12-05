import * as gcp from '@pulumi/gcp';

type CreateTopicParams = {
  resourcePrefix: string;
  messageRetentionDuration?: number;
};

const TWO_DAYS_AS_SECONDS = 60 * 60 * 24 * 2;

export const createTopic = (params: CreateTopicParams) => {
  const messageRetentionDuration =
    params.messageRetentionDuration ?? TWO_DAYS_AS_SECONDS;

  const topic = new gcp.pubsub.Topic(`${params.resourcePrefix}-topic`, {
    messageRetentionDuration: `${messageRetentionDuration}s`,
  });

  return topic;
};
