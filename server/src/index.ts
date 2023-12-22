import express from 'express';
import { pubsub } from './pubsub';

const app = express();
const PORT = process.env.PORT || 3000;
const TOPIC_NAME = process.env.TOPIC_NAME || 'poc-compute-engine';

app.use(express.static('public'));
app.use(express.json());

app.get('/healthz', (req, res) => {
  return res.status(200).json({
    message: 'ok',
    revision: process.env.REVISION,
  });
});

app.post('/event', async (req, res) => {
  await pubsub.topic(TOPIC_NAME).publishMessage(req.body);

  return res.status(200).json({
    message: 'ok',
  });
});

app.post('/webhook', async (req, res) => {
  console.log(req.body);

  return res.status(200).json({
    message: 'ok',
  });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
