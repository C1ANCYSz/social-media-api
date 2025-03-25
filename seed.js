const mongoose = require('mongoose');
const Post = require('./models/Post');
const Comment = require('./models/Comment');
const User = require('./models/User');

const MONGO_URI = 'mongodb://localhost:27017/social-media-api';

const createDummyPostWithComments = async () => {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(MONGO_URI);

    console.log('Database connected.');

    // Create a dummy user (or use an existing one)
    let user = await User.findOne();
    if (!user) {
      user = await User.create({ name: 'Test User' });
      console.log('Dummy user created:', user._id);
    }

    // Create a dummy post
    const post = await Post.create({
      title: 'Dummy Post',
      content: 'This is a dummy post for testing comments.',
      user: user._id,
    });

    console.log('Dummy post created:', post._id);

    const comments = [];
    // Create 20 top-level comments
    for (let i = 1; i <= 20; i++) {
      const comment = await Comment.create({
        post: post._id,
        user: user._id,
        text: `Top-level comment ${i}`,
      });
      comments.push(comment);
    }

    console.log('20 top-level comments added.');

    // Create 2 replies for each comment
    for (const comment of comments) {
      for (let j = 1; j <= 2; j++) {
        await Comment.create({
          replyingTo: comment._id,
          user: user._id,
          text: `Reply ${j} to comment ${comment._id}`,
        });
      }
    }

    console.log('Replies added to each comment.');
    console.log('Dummy post, comments, and replies created successfully.');
  } catch (error) {
    console.error('Error creating dummy data:', error);
  } finally {
    // Close the connection to avoid memory leaks
    mongoose.connection.close();
    console.log('Database connection closed.');
  }
};

// Run the function
createDummyPostWithComments();
