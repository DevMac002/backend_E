const { AuditLog } = require('../models');

const SENSITIVE_QUERY_KEYS = new Set(['password', 'currentPassword', 'newPassword', 'token', 'refreshToken', 'code']);

function safeQuery(query) {
  return Object.fromEntries(Object.entries(query || {}).filter(([key]) => !SENSITIVE_QUERY_KEYS.has(key)));
}

function auditMiddleware(req, res, next) {
  res.on('finish', () => {
    AuditLog.create({
      user_id: req.user?.id || null,
      method: req.method,
      path: req.baseUrl ? `${req.baseUrl}${req.path}` : req.path,
      status_code: res.statusCode,
      ip_address: req.ip || req.socket?.remoteAddress || null,
      user_agent: req.get('user-agent') || null,
      metadata: { query: safeQuery(req.query) },
    }).catch((error) => console.error('Unable to write audit log:', error.message));
  });
  next();
}

module.exports = auditMiddleware;
