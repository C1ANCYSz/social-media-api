const express = require('express');
const Follow = require('../models/Follow');
const Post = require('../models/Post');
const Conversation = require('../models/Conversation');
const AppError = require('../utils/AppError');
const router = express.Router();

router.get('/', async (req, res) => {
  const user = req.user;
  const posts = await Post.find({ user: req.user._id });
  user.posts = posts;
  res.json({
    status: 'success',
    data: {
      user,
    },
  });
});

router.get('/conversations', async (req, res) => {
  const conversations = await Conversation.find({ members: req.user._id });
  if (!conversations) {
    return next(new AppError('No conversations found', 404));
  }
  res.json({
    status: 'success',
    results: conversations.length,
    data: {
      conversations,
    },
  });
});
router.get('/following', async (req, res, next) => {
  const following = await Follow.find({ follower: req.user._id });

  if (!following) {
    return next(new AppError('No following found', 404));
  }
  res.json({
    status: 'success',
    results: following.length,
    data: {
      following,
    },
  });
});

router.get('/followers', async (req, res) => {
  const followers = await Follow.find({ follower: req.user._id });

  if (!followers) {
    return next(new AppError('No followers found', 404));
  }
  res.json({
    status: 'success',
    results: followers.length,
    data: {
      followers,
    },
  });
});
router.get('/posts', async (req, res) => {
  const posts = await Post.find({ user: req.user._id });
  res.json({
    status: 'success',
    results: posts.length,
    data: {
      posts,
    },
  });
});

router.post('/update-profile', (req, res) => {
  res.send('update profile');
});

module.exports = router;
