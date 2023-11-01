import express from 'express';
import logger from 'pino-http';
import axios from 'axios';

const app = express();
const PORT = 3000;
const REVISION = 26;

app.use(logger());

app.get('/', async (req, res) => {
  const result = await axios.get('https://api.ipify.org');

  return res.status(200).json({
    revision: REVISION,
    ip: result.data,
  });
});

app.get('/healthz', (req, res) => {
  console.log('Accessing health check endpoint');

  return res.status(200).json({
    revision: REVISION,
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
