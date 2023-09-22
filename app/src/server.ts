import express from 'express';
import logger from 'pino-http';

const app = express();
const PORT = 3000;
const REVISION = 3;

app.use(logger());

app.get('/', (req, res) => {
  return res.status(200).json({
    revision: REVISION,
  });
});

app.listen(PORT, () => {
  console.log(`Server is started at port ${PORT}`);
});
