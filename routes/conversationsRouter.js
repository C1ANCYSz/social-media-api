const express = require('express');

const router = express.Router();

router.get('/', (req, res) => {
  res.send('get all conversations (pagination and limits apply)');
});
router.get('/:id', (req, res) => {
  res.send('get a conversation');
});
router.post('/:userId', (req, res) => {
  res.send('create a conversation');
});
router.post('/:id/send-message', (req, res) => {
  res.send('send a message');
});

router.delete('/:id', (req, res) => {
  res.send('delete a conversation');
});

//create and delete conversation

module.exports = router;
