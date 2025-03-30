const express = require('express');

const {
  getProfile,
  getConversations,
  getPosts,
  getFollowing,
  getFollowers,
  updateProfile,
} = require('../controllers/meController');

const router = express.Router();

router.get('/', getProfile);

router.get('/conversations', getConversations);

router.get('/posts', getPosts);

router.get('/following', getFollowing);

router.get('/followers', getFollowers);

router.post('/update-profile', updateProfile);

module.exports = router;
