const { verifyToken } = require('./utils/verifyToken');
const User = require('./models/User');
const Message = require('./models/Message');
const Conversation = require('./models/Conversation');

module.exports = (io) => {
  const users = new Map();
  const socketToUsers = new Map(); // TO BE CAHED

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('register', async () => {
      try {
        const decoded = verifyToken(socket);
        const senderUser = await User.findById(decoded.id).select(
          '_id username'
        );
        if (!senderUser) throw new Error('User not found');

        users.set(senderUser._id.toString(), socket.id);
        socketToUsers.set(socket.id, senderUser._id.toString());

        console.log(
          `User ${senderUser._id} registered with socket ID: ${socket.id}`
        );
      } catch (error) {
        console.error('Registration error:', error.message);
      }
    });

    socket.on('joinConversation', (conversationId) => {
      socket.join(conversationId);
      console.log(`User ${socket.id} joined conversation ${conversationId}`);
    });

    socket.on('leaveConversation', (conversationId) => {
      socket.leave(conversationId);
      console.log(`User ${socket.id} left conversation ${conversationId}`);
    });

    socket.on(
      'sendMessage',
      async ({ conversationId, message, replyingTo, type }) => {
        try {
          const decoded = verifyToken(socket);
          const senderUser = await User.findById(decoded.id).select(
            '_id username profilePicture'
          );
          if (!senderUser) throw new Error('User not found');

          const newMessage = await Message.create({
            text: message,
            conversation: conversationId,
            sender: senderUser._id,
            replyingTo,
            type: type || 'text',
          });

          const populatedMessage = await newMessage.populate([
            { path: 'sender', select: 'username profilePicture' },
            {
              path: 'replyingTo',
              select: 'text sender type',
              populate: { path: 'sender', select: 'username' },
            },
          ]);

          const conversation = await Conversation.findByIdAndUpdate(
            conversationId,
            { lastMessage: newMessage._id },
            { new: true }
          ).select('_id members');

          io.to(conversationId).emit('receiveMessage', {
            newMessage: populatedMessage,
            conversationId,
          });

          conversation.members
            .filter((id) => id.toString() !== senderUser._id.toString())
            .forEach((memberId) => {
              const receiverSocketId = users.get(memberId.toString());
              if (receiverSocketId) {
                io.to(receiverSocketId).emit('notification', {
                  sender: senderUser.username,
                  conversationId: conversation._id,
                  message: populatedMessage,
                });
              }
            });
        } catch (error) {
          console.error('Error sending message:', error.message);
          socket.emit('error', { message: 'Failed to send message' });
        }
      }
    );

    socket.on('startCall', async ({ conversationId, isVideoCall, offer }) => {
      try {
        const decoded = verifyToken(socket);
        const user = await User.findById(decoded.id).select(
          '_id username profilePicture'
        );
        if (!user) throw new Error('User not found');

        const conversation = await Conversation.findById(conversationId).select(
          'members'
        );
        if (!conversation)
          return socket.emit('error', { message: 'Conversation not found' });

        const callRoom = `call_${conversationId}`;
        socket.join(callRoom);

        conversation.members
          .filter((id) => id.toString() !== user._id.toString())
          .forEach((memberId) => {
            const receiverSocketId = users.get(memberId.toString());
            if (receiverSocketId) {
              io.to(receiverSocketId).emit('incomingCall', {
                conversationId,
                callerId: user._id,
                callerName: user.username,
                callerImage: user.profilePicture,
                isVideoCall,
                offer,
              });
            }
          });

        console.log(
          `User ${user.username} started a call in ${conversationId}`
        );
      } catch (error) {
        console.error('Error starting call:', error.message);
        socket.emit('error', { message: 'Failed to start call' });
      }
    });

    socket.on('acceptCall', async ({ conversationId, answer, myId }) => {
      try {
        const user = await User.findById(myId).select(
          'username profilePicture'
        );
        if (!user) throw new Error('User not found');

        const callRoom = `call_${conversationId}`;
        io.to(callRoom).emit('callAccepted', {
          answer,
          username: user.username,
          image: user.profilePicture,
        });

        console.log(`${user.username} accepted call in ${conversationId}`);
      } catch (error) {
        console.error('Error accepting call:', error.message);
      }
    });

    socket.on('candidate', ({ candidate, conversationId }) => {
      const callRoom = `call_${conversationId}`;
      io.to(callRoom).emit('candidate', candidate);
    });

    socket.on('endCall', ({ conversationId, userId }) => {
      console.log(`User ${userId} ended the call in ${conversationId}`);
      io.to(conversationId).emit('userLeft', { userId });
    });

    socket.on('typing', ({ conversationId, userId }) => {
      socket.to(conversationId).emit('typing', { conversationId, userId });
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
      const userId = socketToUsers.get(socket.id);
      if (userId) {
        users.delete(userId);
        socketToUsers.delete(socket.id);
        console.log(`User ${userId} unregistered`);
      }
    });
  });
};
