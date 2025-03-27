const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  username: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  age: {
    type: Number,
  },
  bio: {
    type: String,
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
    select: false,
  },
  confirmPassword: {
    type: String,
    required: true,
    validate: {
      validator: function (value) {
        return value === this.password;
      },
      message: 'Passwords do not match!',
    },
  },
  profilePicture: {
    type: String,
    default: function () {
      return `https://avatar.iran.liara.run/public/boy?username=${this.username}`;
    },
  },
  followersCount: { type: Number, default: 0 },
  followingCount: { type: Number, default: 0 },
  postsCount: { type: Number, default: 0 },
  blocked: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  ],
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 10);
  this.confirmPassword = undefined;
  next();
});

userSchema.methods.checkPassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};
module.exports = mongoose.model('User', userSchema);
