const { AuditLog } = require('../models');
const { emitAuditLog } = require('../config/socket');

const SENSITIVE_QUERY_KEYS = new Set(['password', 'currentPassword', 'newPassword', 'token', 'refreshToken', 'code']);

function safeQuery(query) {
  return Object.fromEntries(Object.entries(query || {}).filter(([key]) => !SENSITIVE_QUERY_KEYS.has(key)));
}

function getRisk(statusCode, method) {
  if (statusCode >= 500) return 'critique';
  if (statusCode >= 400) return 'attention';
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) return 'mutation';
  return 'normal';
}

function getResource(requestPath) {
  const [first] = String(requestPath || '').split('?');
  const segment = first.split('/').filter(Boolean)[0];
  return segment || 'racine';
}

function auditMiddleware(req, res, next) {
  // Avoid recursively recording the audit viewer's polling requests.
  if (req.path.startsWith('/logs')) return next();
  res.on('finish', () => {
    AuditLog.create({
      user_id: req.user?.id || null,
      method: req.method,
      path: req.baseUrl ? `${req.baseUrl}${req.path}` : req.path,
      status_code: res.statusCode,
      ip_address: req.ip || req.socket?.remoteAddress || null,
      user_agent: req.get('user-agent') || null,
      metadata: { query: safeQuery(req.query) },
    }).then((entry) => {
      emitAuditLog({
        id: entry.id,
        created_at: entry.created_at,
        method: entry.method,
        path: entry.path,
        resource: getResource(entry.path),
        status_code: entry.status_code,
        risk: getRisk(entry.status_code, entry.method),
        ip_address: entry.ip_address ? 'Masquée' : null,
        User: req.user ? { id: req.user.id, username: req.user.username } : null,
      });
    }).catch((error) => console.error('Unable to write audit log:', error.message));
  });
  next();
}

module.exports = auditMiddleware;
