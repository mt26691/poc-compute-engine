import 'dotenv/config';
import express from 'express';
import { pubsub } from './pubsub';
import { Subscription } from '@google-cloud/pubsub';

const app = express();
const PORT = process.env.PORT || 3000;
const TOPIC_NAME = process.env.TOPIC_NAME || 'unset';
const SUBSCRIPTION_NAME = process.env.SUBSCRIPTION_NAME || 'unset';
let subscription: Subscription;

app.use(express.static('public'));
app.use(express.json());

const waitSec = (sec: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, sec * 1000);
  });
};

// listen for new messages
subscription = pubsub
  .subscription(SUBSCRIPTION_NAME, {
    batching: {
      maxMessages: 1,
    },
  })
  .on('message', async (message) => {
    const data = JSON.parse(message.data.toString());
    console.log('message received', data, new Date().toISOString());

    await waitSec(5);

    if (data.attempt === 51) {
      console.log('message unack', data, message.publishTime);
      message.nack();
      return;
    }

    console.log('message ack', data, message.publishTime);
    message.ack();
  });

subscription.on('error', (error) => {
  console.error('error', error);
});

subscription.on('close', () => {
  console.log('subscription closed');
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
  await pubsub
    .topic(TOPIC_NAME, {
      messageOrdering: true,
      batching: {
        maxMessages: 1,
      },
    })
    .publishMessage({
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
