const express = require('express');

const {
  getPost,
  getPostWithComments,
  getPostReactions,
  createPost,
  commentOnPost,
  replyToComment,
  toggleReaction,
  deletePost,
  deleteCpmment,
} = require('../controllers/postsController');

const { checkBlockedForPosts } = require('../middlewares/checkBlocked');

const router = express.Router();

router.get('/:id', checkBlockedForPosts, getPost);

router.get('/:id/comments', checkBlockedForPosts, getPostWithComments);

router.get('/:id/reactions', checkBlockedForPosts, getPostReactions);

router.post('/create-post', createPost);

router.post('/:id/comment', checkBlockedForPosts, commentOnPost);

router.post(
  '/:id/comments/:commentId/reply',
  checkBlockedForPosts,
  replyToComment
);

router.post('/:id/toggle-reaction', checkBlockedForPosts, toggleReaction);

router.delete('/:id', deletePost);

router.delete('/:id/comments/:commentId', deleteCpmment);

module.exports = router;
