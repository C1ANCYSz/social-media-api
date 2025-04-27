# Social Media API Documentation

## Overview

This API powers a feature-rich social networking platform with robust authentication, user management, posting capabilities, conversation handling, and interactive social features.

## Features

### Authentication

- Secure JWT-based authentication with HTTP-only cookies
- User registration with email verification
- Login with username or email
- Password reset functionality
- Protection against brute force attacks

### User Management

- Profile creation and customization
- Follow/unfollow functionality
- User blocking capabilities
- Comprehensive profile viewing

### Posts & Engagement

- Create, view, and delete posts
- Support for media attachments
- Rich commenting system with nested replies
- Multiple reaction types (like, love, haha, sad, angry)
- Comment management

### Messaging

- Private conversations between users
- Conversation management
- Message history and pagination

### Security Features

- Input sanitization and validation
- Protection against XSS and CSRF attacks
- Secure password handling
- Authorization middleware

## API Endpoints

### Authentication

- POST `/auth/signup` - Create new account
- POST `/auth/login` - Authenticate user
- POST `/auth/logout` - End user session
- POST `/auth/verify-email` - Confirm email address
- POST `/auth/forgot-password` - Request password reset
- POST `/auth/reset-password/:token` - Set new password

### User Profiles

- GET `/me/profile` - Get current user profile
- GET `/me/posts` - Get current user posts
- GET `/me/following` - Get users followed by current user
- GET `/me/followers` - Get current user's followers
- PUT `/me/profile` - Update profile information
- GET `/me/conversations` - Get user conversations

### Users

- GET `/users/:username` - Get user profile
- GET `/users/:username/posts` - Get user's posts
- POST `/users/:username/block` - Block/unblock user
- POST `/users/:username/follow` - Follow/unfollow user

### Posts

- GET `/posts/:id` - Get single post
- GET `/posts/:id/comments` - Get post with comments
- GET `/posts/:id/reactions` - Get post reactions
- POST `/posts` - Create new post
- POST `/posts/:id/comment` - Comment on post
- POST `/posts/:id/comments/:commentId/reply` - Reply to comment
- POST `/posts/:id/reaction` - Add/remove reaction
- DELETE `/posts/:id` - Delete post
- DELETE `/posts/:id/comments/:commentId` - Delete comment

### Conversations

- GET `/conversations/:id` - Get conversation with messages
- POST `/conversations/user/:userId` - Start/get conversation with user
- DELETE `/conversations/:id` - Delete conversation

## Technical Implementation

- **Express.js** application with modular controller architecture
- **MongoDB** with Mongoose ODM for data persistence
- **JWT** for stateless authentication
- **Express-async-errors** for simplified error handling
- Secure cookie implementation with CSRF protection
- Input validation and sanitization with validator
- Transaction support for data integrity

## Security Considerations

- HTTP-only cookies prevent client-side access to tokens
- Secure flag ensures cookies are only sent over HTTPS in production
- Same-site cookies mitigate CSRF attacks
- Input sanitization prevents XSS attacks
- Rate limiting on authentication endpoints
- Proper error handling with custom AppError class

---

Designed for scalability and performance while maintaining robust security practices.
