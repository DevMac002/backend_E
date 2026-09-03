const { AuditLog } = require('../models');
const { emitAuditLog } = require('../config/socket');

function getRisk(statusCode, method) {
  if (statusCode >= 500) return 'critique';
  if (statusCode >= 400) return 'attention';

  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    return 'mutation';
  }

  return 'normal';
}

function getResource(requestPath) {
  const [first] = String(requestPath || '').split('?');
  const segment = first.split('/').filter(Boolean)[0];

  return segment || 'racine';
}

function auditMiddleware(req, res, next) {
  // Évite d'enregistrer les requêtes du visualiseur des logs
  // afin de ne pas créer une boucle d'audit.
  if (req.path.startsWith('/logs')) {
    return next();
  }

  const originalJson = res.json;
  const originalSend = res.send;

  let responseOutput = null;

  const startedAt = Date.now();

  // Interception de res.json()
  res.json = function (body) {
    responseOutput = body;

    return originalJson.apply(this, arguments);
  };

  // Interception de res.send()
  res.send = function (body) {
    if (responseOutput === null) {
      responseOutput = body;
    }

    return originalSend.apply(this, arguments);
  };

  res.on('finish', async () => {
    try {
      let parsedOutput = responseOutput;

      // Si la réponse est une chaîne JSON, on essaie de la parser.
      if (typeof responseOutput === 'string') {
        try {
          parsedOutput = JSON.parse(responseOutput);
        } catch (error) {
          // La réponse n'est simplement pas du JSON.
        }
      }

      // Évite d'enregistrer des réponses trop volumineuses.
      if (
        parsedOutput &&
        JSON.stringify(parsedOutput).length > 5000
      ) {
        parsedOutput = '[Response too large to log]';
      }

      const responseTimeMs = Date.now() - startedAt;

      const endpointPath = req.baseUrl
        ? `${req.baseUrl}${req.path}`
        : req.path;

      const entry = await AuditLog.create({
        user_id: req.user?.id || null,

        // IMPORTANT :
        // Les colonnes SQL sont http_method et endpoint_path.
        http_method: req.method,

        endpoint_path: endpointPath,

        status_code: res.statusCode,

        response_time_ms: responseTimeMs,

        ip_address:
          req.ip ||
          req.socket?.remoteAddress ||
          null,

        user_agent:
          req.get('user-agent') ||
          null,

        metadata: {
          inputs: {
            query: req.query || {},
            body: req.body || {},
          },

          headers: req.headers || {},

          output:
            parsedOutput !== undefined
              ? parsedOutput
              : null,
        },
      });

      /*
       * IMPORTANT :
       * On conserve "method" et "path" dans l'événement Socket.IO
       * pour ne pas casser le frontend existant.
       */
      emitAuditLog({
        id: entry.id,

        created_at: entry.created_at,

        method: entry.http_method,

        path: entry.endpoint_path,

        resource: getResource(entry.endpoint_path),

        status_code: entry.status_code,

        risk: getRisk(
          entry.status_code,
          entry.http_method
        ),

        ip_address: entry.ip_address,

        user_agent: entry.user_agent,

        metadata: entry.metadata,

        User: req.user
          ? {
              id: req.user.id,
              username: req.user.username,
              email: req.user.email,
            }
          : null,
      });
    } catch (error) {
      console.error(
        'Unable to write audit log:',
        error.message
      );
    }
  });

  next();
}

module.exports = auditMiddleware;