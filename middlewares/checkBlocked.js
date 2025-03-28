const Post = require('../models/Post');
const User = require('../models/User');
const AppError = require('../utils/AppError');

exports.checkBlockedForPosts = async function (req, res, next) {
  const { id } = req.params;

  const post = await Post.findOne({ _id: id }).populate('postedBy', '_id');

  if (!post || !post.postedBy) {
    return next(new AppError('Post not found', 404));
  }

  const userToCheck = post.postedBy._id;

  const me = await User.findById(req.user._id).select('blocked');

  if (me.blocked.some((blockedId) => blockedId.equals(userToCheck))) {
    return next(new AppError('You have blocked this user', 403));
  }

  next();
};

exports.checkBlockedForUsers = async function (req, res, next) {
  const { username } = req.params;
  const userToCheck = await User.findOne({ username });

  if (!userToCheck) {
    return next(new AppError('User not found', 404));
  }

  const me = await User.findById(req.user._id).select('blocked');

  if (me.blocked.includes(userToCheck._id)) {
    return next(new AppError('You have blocked this user', 403));
  }

  next();
};
