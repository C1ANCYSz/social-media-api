exports.verifyToken = (socket) => {
  try {
    const cookie = socket.handshake.headers.cookie;
    const token = cookie
      ?.split('; ')
      .find((c) => c.startsWith('jwt='))
      ?.split('=')[1];
    if (!token) throw new Error('JWT token missing');
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    socket.emit('error', { message: 'Authentication failed' });
    throw error;
  }
};
