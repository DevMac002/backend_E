# Epika Social API Documentation

## Overview
This document describes the main backend endpoints for Epika Social.

## Base URL
- Development: http://localhost:3000

## Authentication
Most routes require a Bearer token obtained from the authentication endpoints.

### Auth endpoints

#### POST /auth/register
Create a new user account.

Request body:
```json
{
  "username": "john",
  "email": "john@example.com",
  "password": "Secret123!"
}
```

#### POST /auth/login
Authenticate a user.

Request body:
```json
{
  "email": "john@example.com",
  "password": "Secret123!"
}
```

#### POST /auth/send-verification-code
Resend the email verification code.

#### POST /auth/verify-email
Verify the account with the OTP.

#### POST /auth/forgot-password
Request a password reset code.

#### POST /auth/reset-password
Reset the password using the OTP.

#### POST /auth/change-password
Change the current password while authenticated.

#### POST /auth/refresh
Refresh the access token.

#### POST /auth/logout
Logout from the current session.

## Users

### GET /users/me
Get the current authenticated user profile.

### PUT /users/me
Update the current profile.

### POST /users/me/avatar
Upload or replace the current avatar.

### DELETE /users/me
Delete the current account.

### GET /users
List users (admin only).

### GET /users/:id
Get a public profile by ID.

### GET /users/:id/rewards
Get reward history for a user.

### GET /users/leaderboard/foi
Get the Foi leaderboard.

### GET /users/logs/roles
Get role change logs (superadmin only).

## Posts

### GET /posts
Get the classic feed.

### GET /posts/predications
Get predications and announcements feed.

### POST /posts
Create a post.

### GET /posts/:id
Get one post by ID.

### PUT /posts/:id
Update a post.

### DELETE /posts/:id
Delete a post.

### POST /posts/:id/like
Like a post.

### DELETE /posts/:id/like
Remove a like.

### GET /posts/:id/likes
List likes on a post.

### GET /posts/:id/comments
List comments on a post.

### POST /posts/:id/comments
Add a comment.

### DELETE /posts/:id/comments/:commentId
Delete a comment.

### POST /posts/:id/vote
Vote on a poll.

### GET /posts/:id/results
Get poll results.

### POST /posts/:id/answer
Answer a quiz.

### GET /posts/:id/quiz-results
Get quiz results.

## Groups

### GET /groups
List groups.

### GET /groups/discover
Discover public groups.

### POST /groups
Create a group.

### GET /groups/:id
Get a group by ID.

### PUT /groups/:id
Update a group.

### DELETE /groups/:id
Delete a group.

### GET /groups/:id/members
List members of a group.

### POST /groups/:id/members
Add a member to a group.

### DELETE /groups/:id/members/:userId
Remove a member from a group.

### POST /groups/:id/leave
Leave a group.

### PUT /groups/:id/members/:userId/role
Update a member role.

## Messages

### GET /messages/conversations
List conversations.

### GET /messages/unread-count
Get unread message count.

### GET /messages/:conversationId
Get messages for a conversation.

### POST /messages
Send a message.

### PUT /messages/:id/read
Mark a message as read.

### PUT /messages/conversations/:conversationId/read-all
Mark a conversation as read.

## Notifications

### GET /notifications
List notifications.

### PUT /notifications/:id/read
Mark a notification as read.

### PUT /notifications/read-all
Mark all notifications as read.

### DELETE /notifications/:id
Delete a notification.

### GET /notifications/unread-count
Get unread notifications count.

## Search

### GET /search
Search users, posts and groups.

### GET /search/users
Search only users.

### GET /search/groups
Search only groups.

## Admin

### GET /admin/stats
Get global stats.

### GET /admin/stats/growth
Get user growth by day.

### GET /admin/logs
Get role change logs.

## Media

### GET /media/:filename
Serve a media file.

### DELETE /media/:filename
Delete a media file.
