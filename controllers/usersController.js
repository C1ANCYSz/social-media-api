const User = require('../models/User');
const Post = require('../models/Post');
const Follow = require('../models/Follow');
const AppError = require('../utils/AppError');
const mongoose = require('mongoose');
require('express-async-errors');

exports.getUser = async (req, res, next) => {
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
};

exports.getUserPosts = async (req, res, next) => {
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
};

exports.toggleBlock = async (req, res, next) => {
  const { username } = req.params;
  const userToBlock = await User.findOne({ username });

  if (!userToBlock) {
    return next(new AppError('User not found', 404));
  }

  const me = await User.findById(req.user._id);

  if (me._id.equals(userToBlock._id)) {
    return next(new AppError("You can't block yourself", 400));
  }

  if (userToBlock.blocked.includes(me._id)) {
    return next(new AppError('This user has blocked you', 403));
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
};

exports.toggleFollow = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  const { username } = req.params;

  const userToFollow = await User.findOne({ username }).session(session);
  if (!userToFollow) throw new AppError('User not found', 404);

  const me = await User.findById(req.user._id).session(session);
  if (me._id.equals(userToFollow._id))
    throw new AppError("You can't follow yourself", 400);

  const existingFollow = await Follow.findOneAndDelete({
    follower: me._id,
    following: userToFollow._id,
  }).session(session);

  if (existingFollow) {
    await User.updateOne(
      { _id: me._id },
      { $inc: { followingCount: -1 } }
    ).session(session);
    await User.updateOne(
      { _id: userToFollow._id },
      { $inc: { followersCount: -1 } }
    ).session(session);
  } else {
    await Follow.create([{ follower: me._id, following: userToFollow._id }], {
      session,
    });

    await User.updateOne(
      { _id: me._id },
      { $inc: { followingCount: 1 } }
    ).session(session);
    await User.updateOne(
      { _id: userToFollow._id },
      { $inc: { followersCount: 1 } }
    ).session(session);
  }

  await session.commitTransaction();
  res.json({
    success: true,
    message: existingFollow
      ? 'Unfollowed successfully'
      : 'Followed successfully',
  });
};
