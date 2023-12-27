import axios from 'axios';

(async () => {
  for (let i = 45; i < 55; i++) {
    const res = await axios.post('https://linhvuvan.com/event', {
      hi: 'axios',
      version: 2,
      attempt: i,
      orderingKey: 'axios',
    });

    console.log('attempt', i, res.data);
  }
})();
