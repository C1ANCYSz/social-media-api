const express = require('express');
const User = require('../models/User');
const router = express.Router();

router.get('/:username', async (req, res, next) => {
  const username = req.params.username;
  const user = await User.findOne({ username }).select('-email -blocked');
  if (!user) {
    return next(new AppError('User not found', 404));
  }
  res.json({
    status: 'success',
    data: {
      user,
    },
  });
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
