const express = require('express');

const User = require('../models/User');
const Post = require('../models/Post');
const Follow = require('../models/Follow');
const { checkBlockedForUsers } = require('../middlewares/checkBlocked');
const AppError = require('../utils/AppError');

const router = express.Router();

router.post('/:username/toggle-block', async (req, res, next) => {
  const { username } = req.params;
  const userToBlock = await User.findOne({ username });

  if (!userToBlock) {
    return next(new AppError('User not found', 404));
  }

  const me = await User.findById(req.user._id);

  if (me._id.equals(userToBlock._id)) {
    return next(new AppError("You can't block yourself", 400));
  }

  const isBlocked = me.blocked.includes(userToBlock._id);

  const updatedUser = await User.findByIdAndUpdate(
    me._id,
    { [isBlocked ? '$pull' : '$push']: { blocked: userToBlock._id } },
    { new: true }
  );

  res.json({
    success: true,
    message: isBlocked
      ? 'User unblocked successfully'
      : 'User blocked successfully',
    data: { blocked: updatedUser.blocked },
  });
});

router.get('/:username', checkBlockedForUsers, async (req, res, next) => {
  const username = req.params.username;
  const user = await User.findOne({ username }).select('-email -blocked');
  if (!user) {
    return next(new AppError('User not found', 404));
  }
  res.json({
    success: true,
    data: {
      user,
    },
  });
});

router.get('/:username/posts', checkBlockedForUsers, async (req, res, next) => {
  const username = req.params.username;
  const user = User.findOne({ username }).select('-email -blocked');

  if (!user) {
    return next(new AppError('User not found', 404));
  }
  const posts = await Post.find({ postedBy: user._id });

  if (!posts) {
    return next(new AppError('Posts not found', 404));
  }
  res.json({
    success: true,
    results: posts.length,
    data: {
      posts,
    },
  });
});

router.post(
  '/toggle-follow/:username',
  checkBlockedForUsers,
  async (req, res, next) => {
    //add a check for blocked users

    const { username } = req.params;
    const userToFollow = await User.findOne({ username });

    if (!userToFollow) {
      return next(new AppError('User not found', 404));
    }

    const me = req.user;

    if (me._id.equals(userToFollow._id)) {
      return next(new AppError("You can't follow yourself", 400));
    }

    const existingFollow = await Follow.findOne({
      follower: me._id,
      following: userToFollow._id,
    });

    if (existingFollow) {
      await Follow.deleteOne({ _id: existingFollow._id });
      return res.json({ success: true, message: 'Unfollowed successfully' });
    } else {
      await Follow.create({ follower: me._id, following: userToFollow._id });
      return res.json({ success: true, message: 'Followed successfully' });
    }
  }
);

module.exports = router;
