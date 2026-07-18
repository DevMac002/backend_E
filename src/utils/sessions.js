const { UserSession } = require('../models');

function requestMetadata(req) {
  return {
    ip_address: req.ip || req.socket?.remoteAddress || null,
    user_agent: req.get('user-agent') || null,
  };
}

async function createSession(user, req, device) {
  return UserSession.create({ user_id: user.id, device: String(device).trim(), ...requestMetadata(req) });
}

async function validateSession(sessionId, userId) {
  if (!sessionId) return null;
  const session = await UserSession.findOne({ where: { id: sessionId, user_id: userId, revoked_at: null } });
  if (session) await session.update({ last_seen_at: new Date() });
  return session;
}

module.exports = { createSession, validateSession };
