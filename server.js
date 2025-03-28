const app = require('./app');
const mongoose = require('mongoose');
require('dotenv').config();
const socketIO = require('socket.io');
const http = require('http');

const server = http.createServer(app);
const io = socketIO(server);

require('./socket')(io);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.log('MongoDB connection error:', err));

server.listen(3000, () => {
  console.log(
    `Server:3000, CWD: ${process.cwd()} | ENV: ${process.env.NODE_ENV}`
  );
});
