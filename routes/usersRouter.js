const express = require('express');

const router = express.Router();

router.get('/:username', (req, res) => {
  res.send('userProfile');
});

router.post('/:username/toggle-block', (req, res) => {
  res.send('block/unblock');
});

router.get('/:username/posts', (req, res) => {
  res.send('get user posts (pagination and limits apply)');
});

router.post('/toggle-follow/:username', (req, res) => {
  res.send('follow/unfollow');
});

module.exports = router;
