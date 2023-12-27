import axios from 'axios';

(async () => {
  for (let i = 0; i < 10; i++) {
    const res = await axios.post('https://linhvuvan.com/event', {
      hi: 'axios',
      version: 4,
      attempt: i,
      orderingKey: 'linhvuvan',
    });

    console.log('attempt', i, res.data);
  }
})();
