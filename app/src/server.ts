require('dotenv').config();
import express from 'express';
import logger from 'pino-http';
import axios from 'axios';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(logger());

app.get('/', async (req, res) => {
  const result = await axios.get('https://api.ipify.org');

  return res.status(200).json({
    revision: process.env.REVISION,
    ip: result.data,
    code: 'ok',
    message: 'This is a sample app.',
  });
});

app.get('/healthz', (req, res) => {
  return res.status(200).json({
    revision: process.env.REVISION,
  });
});

app.get('/secrets', (req, res) => {
  return res.status(200).json({
    secrets: process.env,
  });
});

app.listen(PORT, () => {
  console.log(`Server is started at port ${PORT}`);
});
