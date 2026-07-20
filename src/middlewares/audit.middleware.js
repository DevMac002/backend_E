const { AuditLog } = require('../models');
const { emitAuditLog } = require('../config/socket');

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

  const originalJson = res.json;
  const originalSend = res.send;
  let responseOutput = null;

  res.json = function (body) {
    responseOutput = body;
    return originalJson.apply(this, arguments);
  };

  res.send = function (body) {
    if (!responseOutput) responseOutput = body;
    return originalSend.apply(this, arguments);
  };

  res.on('finish', () => {
    let parsedOutput = responseOutput;
    if (typeof responseOutput === 'string') {
      try { parsedOutput = JSON.parse(responseOutput); } catch (e) {}
    }
    // Limit large outputs
    if (parsedOutput && JSON.stringify(parsedOutput).length > 5000) {
      parsedOutput = '[Response too large to log]';
    }

    AuditLog.create({
      user_id: req.user?.id || null,
      method: req.method,
      path: req.baseUrl ? `${req.baseUrl}${req.path}` : req.path,
      status_code: res.statusCode,
      ip_address: req.ip || req.socket?.remoteAddress || null,
      user_agent: req.get('user-agent') || null,
      metadata: {
        inputs: {
          query: req.query || {},
          body: req.body || {},
        },
        headers: req.headers || {},
        output: parsedOutput || null,
      },
    }).then((entry) => {
      emitAuditLog({
        id: entry.id,
        created_at: entry.created_at,
        method: entry.method,
        path: entry.path,
        resource: getResource(entry.path),
        status_code: entry.status_code,
        risk: getRisk(entry.status_code, entry.method),
        ip_address: entry.ip_address,
        user_agent: entry.user_agent,
        metadata: entry.metadata,
        User: req.user ? { id: req.user.id, username: req.user.username, email: req.user.email } : null,
      });
    }).catch((error) => console.error('Unable to write audit log:', error.message));
  });
  next();
}

module.exports = auditMiddleware;
