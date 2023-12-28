import axios from 'axios';

(async () => {
  for (let i = 60; i < 70; i++) {
    const res = await axios.post('https://linhvuvan.com/event', {
      hi: 'axios',
      version: 4,
      attempt: i,
      orderingKey: 'wms',
    });

    console.log('attempt', i, res.data);
  }
})();
