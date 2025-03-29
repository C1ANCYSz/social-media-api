const express = require('express');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const mongoose = require('mongoose');
const User = require('../models/User');
const AppError = require('../utils/AppError');
require('express-async-errors');

const router = express.Router();

router.get('/:id', async (req, res, next) => {
  let myId = req.user._id.toString();
  const { id } = req.params;
  const { page = 1, limit = 50 } = req.query;

  const pageNum = Math.max(parseInt(page, 10), 1);
  const limitNum = Math.min(Math.max(parseInt(limit, 10), 1), 50);

  const conversation = await Conversation.findById(id)
    .populate({ path: 'members', select: 'username image' })
    .lean();

  if (!conversation) {
    return next(new AppError('Conversation not found', 404));
  }

  if (!conversation.members.some((member) => member._id.toString() === myId)) {
    return next(new AppError('Unauthorized access to this conversation', 403));
  }

  const messages = await Message.find({ conversation: id })
    .populate('sender', 'username profilePicture')
    .populate({
      path: 'replyingTo',
      select: 'text sender type',
      populate: {
        path: 'sender',
        select: 'username profilePicture',
      },
    })
    .sort({ createdAt: -1 })
    .skip((pageNum - 1) * limitNum)
    .limit(limitNum)
    .lean({ virtuals: true });
  conversation.messages = messages;

  const hasMoreMessages = messages.length === limitNum && messages.length > 0;

  res.status(200).json({ conversation, myId, hasMoreMessages });
});

router.post('/:userId', async (req, res, next) => {
  const { userId } = req.params;

  const otherUser = await User.findById(userId);
  if (!otherUser) {
    return next(new AppError('User not found', 404));
  }

  if (userId === req.user._id.toString()) {
    return next(new AppError('You cannot Message yourself', 400));
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  let conversation = await Conversation.findOne({
    members: { $all: [userId, req.user._id] },
  }).session(session);

  if (!conversation) {
    conversation = await Conversation.create(
      [{ members: [userId, req.user._id] }],
      { session }
    );

    conversation = conversation[0];
  }

  await session.commitTransaction();
  session.endSession();

  console.log(conversation._id);

  res.status(200).json({ conversation });
});

router.delete('/:id', async (req, res, next) => {
  const { id } = req.params;

  const session = await mongoose.startSession();
  session.startTransaction();

  const deletedConversation = await Conversation.deleteOne({
    _id: id,
  }).session(session);
  if (deletedConversation.deletedCount === 0) {
    await session.abortTransaction();
    session.endSession();
    return next(new AppError('Conversation not found', 404));
  }

  await Message.deleteMany({ conversation: id }).session(session);

  await session.commitTransaction();
  session.endSession();

  res.json({ success: true, message: 'Conversation deleted successfully' });
});

module.exports = router;
