const jwt = require('jsonwebtoken');

function generateAccessToken(user, session = null) {
  return jwt.sign({ id: user.id, status: user.status, role: user.role, sid: session?.id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m' });
}

function generateRefreshToken(user, session = null) {
  return jwt.sign({ id: user.id, sid: session?.id }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' });
}

function verifyToken(token, secret) {
  return jwt.verify(token, secret);
}

module.exports = { generateAccessToken, generateRefreshToken, verifyToken };
