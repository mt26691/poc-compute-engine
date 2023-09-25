import express from 'express';
import logger from 'pino-http';
import ip from 'public-ip';

const app = express();
const PORT = 3000;
const REVISION = 9;

app.use(logger());

app.get('/', async (req, res) => {
  return res.status(200).json({
    revision: REVISION,
    ip: await ip.publicIpv4(),
  });
});

app.get('/healthz', (req, res) => {
  return res.status(200).json({
    revision: REVISION,
  });
});

app.listen(PORT, () => {
  console.log(`Server is started at port ${PORT}`);
});
