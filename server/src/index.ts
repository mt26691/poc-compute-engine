import express from 'express';
import { pubsub } from './pubsub';

const app = express();
const PORT = process.env.PORT || 3000;
const TOPIC_NAME = process.env.TOPIC_NAME || 'unset';
const SUBSCRIPTION_NAME = process.env.SUBSCRIPTION_NAME || 'unset';

app.use(express.static('public'));
app.use(express.json());

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
  });

  return res.status(200).json({
    message: 'ok',
  });
});

if (SUBSCRIPTION_NAME !== 'unset') {
  pubsub.subscription(SUBSCRIPTION_NAME).on('message', (message) => {
    console.log('message', message.data.toString());
    message.ack();
  });
}

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
