import express from 'express';

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/healthz', (req, res) => {
  return res.status(200).json({
    message: 'ok',
    revision: process.env.REVISION,
  });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
