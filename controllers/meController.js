const Follow = require('../models/Follow');
const Post = require('../models/Post');
const User = require('../models/User');
const Conversation = require('../models/Conversation');
const AppError = require('../utils/AppError');
require('express-async-errors');

exports.getProfile = async (req, res) => {
  const user = req.user;
  const posts = await Post.find({ user: req.user._id });
  user.posts = posts;
  res.json({
    status: 'success',
    data: {
      user,
    },
  });
};

exports.getConversations = async (req, res, next) => {
  const conversations = await Conversation.find({ members: req.user._id })
    .populate('members', 'username profilePicture')
    .populate('lastMessage', 'text createdAt');

  if (!conversations.length) {
    return res.status(200).json({
      success: true,
      results: 0,
      conversations: [],
    });
  }

  const formattedConversations = conversations.map((conversation) => {
    const otherUser = conversation.members.find(
      (member) => !member._id.equals(req.user._id)
    );

    return {
      _id: conversation._id,
      otherUserName: otherUser?.username || 'Unknown',
      otherUserImage:
        otherUser?.profilePicture ||
        'https://avatar.iran.liara.run/public/boy?username=clancy',
      lastMessage: conversation.lastMessage?.content || 'No messages yet',
    };
  });

  res.json({
    success: true,
    results: formattedConversations.length,
    conversations: formattedConversations,
  });
};

exports.getPosts = async (req, res) => {
  const posts = await Post.find({ postedBy: req.user._id });
  res.json({
    status: 'success',
    results: posts.length,
    data: {
      posts,
    },
  });
};

exports.getFollowing = async (req, res, next) => {
  const following = await Follow.find({ follower: req.user._id }).populate({
    path: 'following',
    select: 'name profilePicture',
  });

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
};

exports.getFollowers = async (req, res) => {
  const followers = await Follow.find({ following: req.user._id }).populate({
    path: 'follower',
    select: 'name profilePicture',
  });

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
};

exports.updateProfile = async (req, res, next) => {
  const { name, age, bio, profilePicture, oldPassword, newPassword } = req.body;
  const userId = req.user._id;

  let updateData = {};

  if (oldPassword || newPassword) {
    if (!oldPassword || !newPassword) {
      return next(new AppError('Both old and new passwords are required', 400));
    }

    const userWithPassword = await User.findById(userId).select('+password');
    if (!userWithPassword) {
      return next(new AppError('User not found', 404));
    }

    const isMatch = await userWithPassword.checkPassword(oldPassword);
    if (!isMatch) {
      return next(new AppError('Old password is incorrect', 400));
    }

    userWithPassword.password = newPassword;
    await userWithPassword.save();

    return res.json({
      success: true,
      message: 'Password updated successfully',
    });
  }

  if (name) updateData.name = name;
  if (age) updateData.age = age;
  if (bio) updateData.bio = bio;
  if (profilePicture) updateData.profilePicture = profilePicture;

  if (Object.keys(updateData).length === 0) {
    return next(
      new AppError('Please provide at least one field to update', 400)
    );
  }

  const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
    new: true,
    runValidators: true,
  });

  res.json({
    success: true,
    data: { user: updatedUser },
  });
};
