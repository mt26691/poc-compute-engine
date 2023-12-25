import axios from 'axios';

(async () => {
  for (let i = 0; i < 100; i++) {
    console.log('attempt', i);

    await axios.post('https://linhvuvan.com/event', {
      hi: 'there',
      attempt: i,
    });
  }
})();
