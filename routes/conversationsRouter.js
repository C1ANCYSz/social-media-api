const express = require('express');

const {
  getConversation,
  startConversation,
  deleteConversation,
} = require('../controllers/conversationController');

const router = express.Router();

router.get('/:id', getConversation);

router.post('/:userId', startConversation);

router.delete('/:id', deleteConversation);

module.exports = router;
