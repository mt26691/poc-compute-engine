import './createPublicGceService';
import { createTopic } from './utils/createTopic';
import { subscribeTopic } from './utils/subscribeTopic';

const topic = createTopic({
  resourcePrefix: 'linhvuvan',
});

subscribeTopic({
  resourcePrefix: 'linhvuvan',
  topic: topic.name,
  pushEndpoint: 'https://linhvuvan.com/webhook-1',
  subscriber: 'app',
  publisher: 'linhvuvan',
});

subscribeTopic({
  resourcePrefix: 'linhvuvan',
  topic: topic.name,
  pushEndpoint: 'https://linhvuvan.com/webhook-2',
  subscriber: 'app',
  publisher: 'linhvuvan',
});
