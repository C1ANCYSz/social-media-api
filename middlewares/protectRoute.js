const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');
const User = require('./../models/User');

exports.protectRoute = async (req, res, next) => {
  try {
    const token = req.cookies?.jwt;
    if (!token)
      return next(new AppError('Authentication required. Please log in.', 401));

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded)
      return next(
        new AppError('Invalid authentication. Please log in again.', 401)
      );

    const user = await User.findById(decoded.id);
    if (!user)
      return next(
        new AppError('User no longer exists. Please sign up again.', 401)
      );

    if (
      user.passwordChangedAt &&
      isPasswordChanged(decoded.iat, user.passwordChangedAt)
    ) {
      return next(
        new AppError(
          'Your password was changed recently. Please log in again.',
          401
        )
      );
    }

    req.user = user;
    return next();
  } catch (err) {
    console.error('JWT verification failed:', err.message);

    if (err instanceof jwt.TokenExpiredError) {
      return next(new AppError('Session expired. Please log in again.', 401));
    }

    if (err instanceof jwt.JsonWebTokenError) {
      return next(new AppError('Invalid token. Please log in again.', 401));
    }

    return next(new AppError('Authentication failed. Please log in.', 401));
  }
};
const isPasswordChanged = (tokenIssuedAt, passwordChangedAt) => {
  const changedTimestamp = Math.floor(passwordChangedAt.getTime() / 1000);
  return tokenIssuedAt < changedTimestamp;
};
