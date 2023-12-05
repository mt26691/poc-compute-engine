import './createPublicGceService';
import { createTopic } from './utils/createTopic';
import { subscribeTopic } from './utils/subscribeTopic';

const topic = createTopic({
  resourcePrefix: 'linhvuvan',
});

subscribeTopic({
  topic: topic.name,
  pushEndpoint: 'https://linhvuvan.com/webhook-1',
  subscriber: 'webhook-1',
  publisher: 'linhvuvan',
});

subscribeTopic({
  topic: topic.name,
  pushEndpoint: 'https://linhvuvan.com/webhook-2',
  subscriber: 'webhook-2',
  publisher: 'linhvuvan',
});
