import 'dotenv/config';
import express from 'express';
import { pubsub } from './pubsub';
import { Message, Subscription } from '@google-cloud/pubsub';

const app = express();
const PORT = process.env.PORT || 3000;
const TOPIC_NAME = process.env.TOPIC_NAME || 'unset';
const SUBSCRIPTION_NAME = process.env.SUBSCRIPTION_NAME || 'unset';
let subscription_one: Subscription;
let subscription_two: Subscription;

app.use(express.static('public'));
app.use(express.json());

const waitSec = (sec: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, sec * 1000);
  });
};

const createMessageHandler =
  (pubsubName: string) => async (message: Message) => {
    const data = JSON.parse(message.data.toString());
    console.log(
      `${pubsubName} message received`,
      data,
      new Date().toISOString(),
      message.publishTime,
    );

    await waitSec(1);

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

// listen for new messages
subscription_one = pubsub
  .subscription(SUBSCRIPTION_NAME, {
    flowControl: {
      maxMessages: 1,
    },
  })
  .on('message', createMessageHandler('subscription_one'));

subscription_one.on('error', (error) => {
  console.error('subscription_one error', error);
});

subscription_one.on('close', () => {
  console.log('subscription_one subscription closed');
});

// listen for new messages
subscription_two = pubsub
  .subscription(SUBSCRIPTION_NAME, {
    flowControl: {
      maxMessages: 1,
    },
  })
  .on('message', createMessageHandler('subscription_two'));

subscription_two.on('error', (error) => {
  console.error('subscription_two error', error);
});

subscription_two.on('close', () => {
  console.log('subscription_two subscription closed');
});

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
  console.log('/pubsub/open', req.body);

  if (req.body.subscriptions.includes('subscription_one')) {
    subscription_one.open();
  }

  if (req.body.subscriptions.includes('subscription_two')) {
    subscription_two.open();
  }

  return res.status(200).json({
    message: 'ok',
  });
});

app.post('/pubsub/close', async (req, res) => {
  console.log('/pubsub/close', req.body);

  if (req.body.subscriptions.includes('subscription_one')) {
    await subscription_one.close();
  }

  if (req.body.subscriptions.includes('subscription_two')) {
    await subscription_two.close();
  }

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
