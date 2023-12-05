import './createPublicGceService';
import { createTopic } from './utils/createTopic';
import { subscribeTopic } from './utils/subscribeTopic';

const topic = createTopic({
  resourcePrefix: 'linhvuvan',
});

subscribeTopic({
  resourcePrefix: 'linhvuvan',
  topic: topic.name,
  pushEndpoint: 'https://linhvuvan.com/webhook',
  subscriber: 'app',
  publisher: 'linhvuvan',
});
