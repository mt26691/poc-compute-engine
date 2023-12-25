import axios from 'axios';

(async () => {
  for (let i = 0; i < 100; i++) {
    const res = await axios.post('https://linhvuvan.com/event', {
      hi: 'axios',
      version: 6,
      attempt: i,
    });

    console.log('attempt', i, res.data);
  }
})();
