const express = require('express');
const authRouter = require('./routes/authRouter');
const usersRouter = require('./routes/usersRouter');
const postsRouter = require('./routes/postsRouter');
const conversationsRouter = require('./routes/conversationsRouter');
const meRouter = require('./routes/meRouter');
const errorController = require('./controllers/errorControllers');

const app = express();
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/me', meRouter);
app.use('/api/users', usersRouter);
app.use('/api/posts', postsRouter);
app.use('/api/conversations', conversationsRouter);
app.use(errorController);
module.exports = app;
