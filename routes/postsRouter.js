const express = require('express');
const Follow = require('../models/Follow');
const Post = require('../models/Post');
const Conversation = require('../models/Conversation');
const Comment = require('../models/Comment');
const AppError = require('../utils/AppError');

const router = express.Router();

router.post('/create-post', async (req, res, next) => {
  const { content } = req.body;
  const media = req.body?.media;

  if (!content) {
    return next(new AppError('Comment content is required', 400));
  }

  const post = await Post.create({
    content,
    media: media || null,
    user: req.user._id,
  });

  res.json({
    status: 'success',
    data: {
      post,
    },
  });
});

router.get('/:id', async (req, res, next) => {
  const post = await Post.findById(req.params.id);
  if (!post) {
    return next(new AppError('Post not found', 404));
  }

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = page === 1 ? 50 : (page - 2) * limit + 50;

  let commentsQuery = { post: post._id, replyingTo: null };

  let comments;
  if (page === 1) {
    comments = await Comment.find(commentsQuery)
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('user', 'username profilePicture')
      .lean();
  } else {
    comments = await Comment.find(commentsQuery)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'username profilePicture')
      .lean();
  }

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

  const totalComments = await Comment.countDocuments(commentsQuery);

  res.json({
    status: 'success',
    data: {
      post,
      comments,
      pagination: {
        totalComments,
        currentPage: page,
        totalPages: Math.ceil((totalComments - 50) / limit) + 1,
        hasNextPage: skip + limit < totalComments,
      },
    },
  });
});

router.get('/', (req, res) => {
  res.send('get all posts (pagination and limits apply)');
});

router.post('/:id/toggle-reaction', (req, res) => {
  res.send('like/unlike post');
});

router.post('/:id/comments', async (req, res, next) => {
  const { text } = req.body;
  const media = req.body?.media;

  if (!text) {
    return next(new AppError('Comment content is required', 400));
  }

  const post = await Post.findById(req.params.id);

  if (!post) {
    return next(new AppError('Post not found', 404));
  }

  const newComment = await Comment.create({
    post: post._id,
    user: req.user._id,
    text,
    media: media || null,
  });
  post.commentsCount += 1;
  await post.save();

  res.json({
    status: 'success',
    data: {
      comment: newComment,
    },
  });
});

router.post('/:id/comments/:commentId/reply', async (req, res, next) => {
  try {
    const { text, media } = req.body;
    const { commentId, postId } = req.params;

    if (!text) {
      return next(new AppError('Reply content is required', 400));
    }

    const comment = await Comment.findOne({ _id: commentId });

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
      status: 'success',
      data: {
        reply: newComment,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id/comments/:commentId', async (req, res, next) => {
  const comment = await Comment.findById(req.params.commentId)
    .populate('user', 'username profilePicture')
    .lean();

  if (!comment) {
    return next(
      new AppError('Comment not found or does not belong to this post', 404)
    );
  }

  res.json({
    status: 'success',
    data: {
      comment,
    },
  });
});

router.delete('/:id/comments/:commentId', async (req, res, next) => {
  try {
    const { postId, commentId } = req.params;

    const comment = await Comment.findOneAndDelete({
      _id: commentId,
      post: postId,
    });

    if (!comment) {
      return next(
        new AppError('Comment not found or does not belong to this post', 404)
      );
    }

    await Post.findByIdAndUpdate(postId, { $inc: { commentsCount: -1 } });

    res.json({ status: 'success', message: 'Comment deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
