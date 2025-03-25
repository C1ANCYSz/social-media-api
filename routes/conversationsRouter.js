const express = require('express');

const router = express.Router();

router.get('/:id', (req, res) => {
  res.send('get a conversation');
});

router.post('/:id/send-message', (req, res) => {
  res.send('send a message');
});

module.exports = router;
