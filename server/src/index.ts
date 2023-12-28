import 'dotenv/config';
import express from 'express';
import { pubsub } from './pubsub';
import { Message } from '@google-cloud/pubsub';

const app = express();
const PORT = process.env.PORT || 3000;
const TOPIC_NAME = process.env.TOPIC_NAME || 'unset';
const SUBSCRIPTION_NAME = process.env.SUBSCRIPTION_NAME || 'unset';

app.use(express.static('public'));
app.use(express.json());

const createMessageHandler =
  (pubsubName: string) => async (message: Message) => {
    const data = JSON.parse(message.data.toString());
    if (data.attempt === 51) {
      console.log(
        `${pubsubName} message unack`,
        data,
        new Date().toISOString(),
        message.publishTime,
      );
      message.nack();
      return;
    }

    console.log(
      `${pubsubName} message ack`,
      data,
      new Date().toISOString(),
      message.publishTime,
    );
    message.ack();
  };

const subscription = pubsub
  .subscription(SUBSCRIPTION_NAME, {
    flowControl: { maxMessages: 1 },
  })
  .on('message', createMessageHandler(Math.random().toString()))
  .on('error', console.error)
  .on('close', () => console.log('subscription closed'));

app.get('/healthz', (req, res) => {
  return res.status(200).json({
    message: 'ok',
    revision: process.env.REVISION,
  });
});

app.post('/event', async (req, res) => {
  console.log('/event', req.body);

  // publish message
  await pubsub.topic(TOPIC_NAME).publishMessage({
    json: req.body,
    orderingKey: req.body.orderingKey,
  });

  return res.status(200).json({
    message: 'ok',
  });
});

app.post('/pubsub/open', (req, res) => {
  console.log('/pubsub/open');
  subscription.open();

  return res.status(200).json({
    message: 'ok',
  });
});

app.post('/pubsub/close', async (req, res) => {
  console.log('/pubsub/close');
  await subscription.close();

  return res.status(200).json({
    message: 'ok',
  });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// process.on('SIGTERM', async () => {
//   console.log('SIGTERM signal received: closing HTTP server');
//   await subscription.close();
//   process.exit(0);
// });

// process.on('exit', async () => {
//   console.log('exit signal received: closing HTTP server');
//   await subscription.close();
//   process.exit(0);
// });
