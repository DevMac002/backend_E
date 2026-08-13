const express = require('express');
const request = require('supertest');

jest.mock('../src/middlewares/auth.middleware', () => {
  return (req, _res, next) => {
    req.user = { id: 1, username: 'alice', status: 'user', role: 'peuple' };
    next();
  };
});

jest.mock('../src/middlewares/status.middleware', () => ({
  requireNotBanned: (req, res, next) => next(),
  requireAccess: () => (req, res, next) => next(),
}));

jest.mock('../src/controllers/user.controller', () => ({
  listUsers: (_req, res) => res.status(200).json({ data: [{ id: 1, username: 'alice' }] }),
  getMe: (_req, res) => res.status(200).json({ id: 1 }),
  updateMe: (_req, res) => res.status(200).json({ ok: true }),
  changeEmail: (_req, res) => res.status(200).json({ ok: true }),
  listMyDevices: (_req, res) => res.status(200).json([]),
  revokeMyDevice: (_req, res) => res.status(200).json({ ok: true }),
  listUserDevices: (_req, res) => res.status(200).json([]),
  getUserById: (_req, res) => res.status(200).json({ id: 1 }),
  uploadAvatar: (_req, res) => res.status(200).json({ ok: true }),
  deleteMe: (_req, res) => res.status(200).json({ ok: true }),
  updateUserRole: (_req, res) => res.status(200).json({ ok: true }),
  updateUserStatus: (_req, res) => res.status(200).json({ ok: true }),
  banUser: (_req, res) => res.status(200).json({ ok: true }),
  temporaryBlockUser: (_req, res) => res.status(200).json({ ok: true }),
  updateUserRestrictions: (_req, res) => res.status(200).json({ ok: true }),
  rewardUser: (_req, res) => res.status(200).json({ ok: true }),
  adminDeleteUser: (_req, res) => res.status(200).json({ ok: true }),
  getUserRewards: (_req, res) => res.status(200).json([]),
  getLeaderboard: (_req, res) => res.status(200).json([]),
  getRoleLogs: (_req, res) => res.status(200).json([]),
}));

const userRoutes = require('../src/routes/user.routes');
const postRoutes = require('../src/routes/post.routes');

jest.mock('../src/controllers/post.controller', () => ({
  listPosts: (_req, res) => res.status(200).json({ data: [{ id: 1 }] }),
  listMyPosts: (_req, res) => res.status(200).json({ data: [{ id: 42, author_id: 1, type: 'post' }] }),
  listPredications: (_req, res) => res.status(200).json({ data: [] }),
  createPost: (_req, res) => res.status(201).json({ id: 1 }),
  getPost: (_req, res) => res.status(200).json({ id: 1 }),
  updatePost: (_req, res) => res.status(200).json({ ok: true }),
  deletePost: (_req, res) => res.status(200).json({ ok: true }),
  likePost: (_req, res) => res.status(200).json({ ok: true }),
  unlikePost: (_req, res) => res.status(200).json({ ok: true }),
  listLikes: (_req, res) => res.status(200).json([]),
  listComments: (_req, res) => res.status(200).json([]),
  addComment: (_req, res) => res.status(201).json({ ok: true }),
  deleteComment: (_req, res) => res.status(200).json({ ok: true }),
  voteOnPost: (_req, res) => res.status(200).json({ ok: true }),
  getPollResults: (_req, res) => res.status(200).json({ ok: true }),
  answerQuiz: (_req, res) => res.status(200).json({ ok: true }),
  getQuizResults: (_req, res) => res.status(200).json({ ok: true }),
}));

describe('User listing', () => {
  it('allows any authenticated user to access the user list', async () => {
    const app = express();
    app.use('/users', userRoutes);

    const response = await request(app).get('/users');

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([{ id: 1, username: 'alice' }]);
  });
});

describe('My posts', () => {
  it('returns only the current user posts on /posts/me', async () => {
    const app = express();
    app.use('/posts', postRoutes);

    const response = await request(app).get('/posts/me');

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].author_id).toBe(1);
  });
});
