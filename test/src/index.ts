import axios from 'axios';

(async () => {
  for (let i = 0; i < 100; i++) {
    const res = await axios.post('https://linhvuvan.com/event', {
      hi: 'axios',
      version: 4,
      attempt: i,
      orderingKey: 'axios',
    });

    console.log('attempt', i, res.data);
  }
})();
