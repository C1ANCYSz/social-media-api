const express = require('express');
const Follow = require('../models/Follow');
const Post = require('../models/Post');
const Conversation = require('../models/Conversation');
const Comment = require('../models/Comment');
const Reaction = require('../models/Reaction');
const mongoose = require('mongoose');
const AppError = require('../utils/AppError');

require('express-async-errors');

const router = express.Router();

router.get('/:id', async (req, res, next) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    return next(new AppError('Post not found', 404));
  }

  res.json({
    success: true,
    data: {
      post,
    },
  });
});

router.get('/:id/comments', async (req, res, next) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    return next(new AppError('Post not found', 404));
  }

  const page = Math.max(parseInt(req.query.page) || 1, 1);
  let limit = parseInt(req.query.limit) || 10;
  const initialBatchSize = 50;

  const totalComments = await Comment.countDocuments({
    post: post._id,
    replyingTo: null,
  });

  let skip;
  if (page === 1) {
    skip = 0;
    limit = initialBatchSize;
  } else {
    skip = initialBatchSize + (page - 2) * limit;
  }

  let comments = await Comment.aggregate([
    { $match: { post: post._id, replyingTo: null } },
    { $sort: { createdAt: -1 } },
    { $skip: skip },
    { $limit: limit },
    {
      $lookup: {
        from: 'users',
        localField: 'user',
        foreignField: '_id',
        as: 'user',
      },
    },
    { $unwind: '$user' },
  ]);

  const commentIds = comments.map((comment) => comment._id);
  const replies = await Comment.find({ replyingTo: { $in: commentIds } })
    .populate('user', 'username profilePicture')
    .lean();

  const replyMap = new Map();
  replies.forEach((reply) => {
    if (!replyMap.has(reply.replyingTo.toString())) {
      replyMap.set(reply.replyingTo.toString(), []);
    }
    replyMap.get(reply.replyingTo.toString()).push(reply);
  });

  comments.forEach((comment) => {
    comment.replies = replyMap.get(comment._id.toString()) || [];
  });

  const totalPages = Math.max(
    Math.ceil((totalComments - initialBatchSize) / limit) + 1,
    1
  );

  res.json({
    success: true,
    data: {
      post,
      comments,
      pagination: {
        totalComments,
        currentPage: page,
        totalPages,
        hasNextPage: skip + limit < totalComments,
      },
    },
  });
});

router.get('/:id/reactions', async (req, res, next) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    return next(new AppError('Post not found', 404));
  }

  const reactions = await Reaction.find({ post: post._id });

  res.json({
    success: true,
    data: {
      reactions,
    },
  });
});

router.post('/create-post', async (req, res, next) => {
  const { content } = req.body;
  const media = req.body?.media;

  if (!content) {
    return next(new AppError('Post content is required', 400));
  }

  const post = await Post.create({
    postedBy: req.user._id,
    content,
    media: media || null,
    user: req.user._id,
  });

  res.json({
    sucess: true,
    data: {
      post,
    },
  });
});

router.post('/:id/comment', async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  const { text, media } = req.body;
  if (!text) return next(new AppError('Comment content is required', 400));

  const post = await Post.findById(req.params.id).session(session);
  if (!post) {
    await session.abortTransaction();
    session.endSession();
    return next(new AppError('Post not found', 404));
  }

  const newComment = await Comment.create(
    [{ post: post._id, user: req.user._id, text, media: media || null }],
    { session }
  );

  post.commentsCount += 1;
  await post.save({ session });

  await session.commitTransaction();
  session.endSession();

  res.json({
    success: true,
    data: { comment: newComment[0] },
  });
});

router.post('/:id/comments/:commentId/reply', async (req, res, next) => {
  const { text } = req.body;
  const media = req.body?.media;
  const { commentId, id } = req.params;

  if (!text) {
    return next(new AppError('Reply content is required', 400));
  }

  const comment = await Comment.findOne({ _id: commentId, post: id });

  if (!comment) {
    return next(
      new AppError('Comment not found or does not belong to this post', 404)
    );
  }

  const newComment = await Comment.create({
    post: null,
    user: req.user._id,
    text,
    replyingTo: comment._id,
    media: media || null,
  });

  res.json({
    success: true,
    data: {
      reply: newComment,
    },
  });
});

router.post('/:id/toggle-reaction', async (req, res, next) => {
  const { id } = req.params;
  const { reaction } = req.body;

  if (!reaction) {
    return next(new AppError('Reaction is required', 400));
  }

  const validReactions = ['like', 'love', 'haha', 'sad', 'angry'];
  if (!validReactions.includes(reaction)) {
    return next(new AppError('Invalid reaction type', 400));
  }

  const isReacted = await Reaction.findOne({ post: id, user: req.user._id });

  if (isReacted) {
    await Promise.all([
      Reaction.deleteOne({ _id: isReacted._id }),
      Post.findByIdAndUpdate(id, { $inc: { reactionsCount: -1 } }),
    ]);

    return res.json({
      success: true,
      message: 'Reaction deleted successfully',
    });
  }

  const [newReaction] = await Promise.all([
    Reaction.create({ post: id, user: req.user._id, reaction }),
    Post.findByIdAndUpdate(id, { $inc: { reactionsCount: 1 } }),
  ]);

  res.json({ success: true, data: { reaction: newReaction } });
});

router.get('/', (req, res) => {
  res.send('get all posts (pagination and limits apply)');
});

router.delete('/:id', async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  const post = await Post.findOne({ _id: req.params.id }).session(session);
  console.log(post);
  if (!post) {
    await session.abortTransaction();
    session.endSession();
    return next(new AppError('Post not found', 404));
  }

  if (post.postedBy.toString() !== req.user._id.toString()) {
    await session.abortTransaction();
    session.endSession();
    return next(
      new AppError('You are not authorized to delete this post', 403)
    );
  }

  await Promise.all([
    Post.deleteOne({ _id: post._id }).session(session),
    Conversation.deleteMany({ post: post._id }).session(session),
    Comment.deleteMany({ post: post._id }).session(session),
  ]);

  await session.commitTransaction();
  session.endSession();

  res.json({ success: true, message: 'Post deleted successfully' });
});

router.delete('/:id/comments/:commentId', async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id, commentId } = req.params;

    const comment = await Comment.findOne({ _id: commentId }).session(session);

    console.log(comment);
    if (!comment) {
      throw new AppError(
        'Comment not found or does not belong to this post',
        404
      );
    }

    if (comment.user.toString() !== req.user._id.toString()) {
      throw new AppError('You are not authorized to delete this comment', 403);
    }

    await Comment.deleteOne({ _id: commentId }).session(session);
    const deletedReplies = await Comment.deleteMany({
      replyingTo: commentId,
    }).session(session);

    if (comment.replyingTo === null) {
      await Post.findByIdAndUpdate(id, {
        $inc: { commentsCount: -(deletedReplies.deletedCount + 1) },
      }).session(session);
    }

    await session.commitTransaction();
    session.endSession();

    res.json({ success: true, message: 'Comment deleted successfully' });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
});

module.exports = router;
