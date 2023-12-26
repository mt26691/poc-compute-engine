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

subscription = pubsub
  .subscription(SUBSCRIPTION_NAME)
  .on('message', (message) => {
    console.log('message', message.data.toString(), message.publishTime);
    message.ack();
  });

pubsub.subscription(SUBSCRIPTION_NAME).on('error', (error) => {
  console.error('error', error);
});

app.get('/healthz', (req, res) => {
  return res.status(200).json({
    message: 'ok',
    revision: process.env.REVISION,
  });
});

app.post('/event', async (req, res) => {
  console.log('/event', req.body);

  await pubsub.topic(TOPIC_NAME).publishMessage({
    json: req.body,
    orderingKey: 'ordering-key',
  });

  return res.status(200).json({
    message: 'ok',
  });
});

app.post('/pubsub/open', (req, res) => {
  subscription.open();

  return res.status(200).json({
    message: 'ok',
  });
});

app.post('/pubsub/close', (req, res) => {
  subscription.close();

  return res.status(200).json({
    message: 'ok',
  });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
