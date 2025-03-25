const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
    },
    replyingTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
    },
    type: { type: String, enum: ['text', 'voice', 'image'] },

    content: { type: String, required: true },

    seen: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
