const express = require('express');

const {
  getUser,
  getUserPosts,
  toggleBlock,
  toggleFollow,
} = require('../controllers/usersController');

const { checkBlockedForUsers } = require('../middlewares/checkBlocked');

const router = express.Router();

router.get('/:username', checkBlockedForUsers, getUser);

router.get('/:username/posts', checkBlockedForUsers, getUserPosts);

router.post('/:username/toggle-block', toggleBlock);

router.post('/toggle-follow/:username', checkBlockedForUsers, toggleFollow);

module.exports = router;
