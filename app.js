const express = require('express');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
require('dotenv').config();

const authRouter = require('./routes/authRouter');
const usersRouter = require('./routes/usersRouter');
const postsRouter = require('./routes/postsRouter');
const conversationsRouter = require('./routes/conversationsRouter');
const meRouter = require('./routes/meRouter');

const errorHandling = require('./middlewares/errorHandling');
const { protectRoute } = require('./middlewares/protectRoute');

const app = express();

app.use(express.json());
app.use(cookieParser());
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

app.use('/api/auth', authRouter);

app.use(protectRoute);
app.use('/api/me', meRouter);
app.use('/api/users', usersRouter);
app.use('/api/posts', postsRouter);
app.use('/api/conversations', conversationsRouter);

app.use(errorHandling);

app.use('*', (req, res) =>
  res.status(404).json({ message: '404, page not found' })
);

module.exports = app;
