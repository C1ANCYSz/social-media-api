const express = require('express');

const router = express.Router();

router.get('/', (req, res) => {
  res.send('get all posts (pagination and limits apply)');
});

router.get('/:id', (req, res) => {
  res.send('get a post');
});

router.post('/:id/toggle-like', (req, res) => {
  res.send('like/unlike post');
});

router.post('/:id/comment', (req, res) => {
  res.send('comment on post');
});

router.post('/:commentId/reply', (req, res) => {
  res.send('reply on a comment');
});

router.delete('/delete-comment/:commentId', (req, res) => {
  res.send('delete comment on post');
});

module.exports = router;
