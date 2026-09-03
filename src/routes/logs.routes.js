const express = require('express');
const path = require('path');

const { AuditLog, User, Op } = require('../models');

const router = express.Router();

const METHODS = new Set([
  'GET',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
]);

const CSV_FIELDS = [
  'id',
  'created_at',
  'method',
  'path',
  'status_code',
  'risk',
  'user',
  'email',
  'ip_address',
  'user_agent',
  'metadata',
];

/**
 * ============================================================
 * HELPERS
 * ============================================================
 */

function getRisk(statusCode, method) {
  if (statusCode >= 500) {
    return 'critique';
  }

  if (statusCode >= 400) {
    return 'attention';
  }

  if (
    ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)
  ) {
    return 'mutation';
  }

  return 'normal';
}

function getResource(requestPath) {
  const [first] = String(requestPath || '').split('?');

  const segment = first
    .split('/')
    .filter(Boolean)[0];

  return segment || 'racine';
}

/**
 * ============================================================
 * FILTERS
 * ============================================================
 */

function buildWhere(query) {
  const where = {};
  const and = [];

  const method = String(
    query.method || ''
  ).toUpperCase();

  const pathFilter = String(
    query.path || query.q || ''
  ).trim();

  /**
   * IMPORTANT :
   *
   * Frontend/API :
   *   method
   *
   * Base de données :
   *   http_method
   */
  if (METHODS.has(method)) {
    where.http_method = method;
  }

  if (query.user_id) {
    const userId = Number(query.user_id);

    if (Number.isInteger(userId)) {
      where.user_id = userId;
    }
  }

  /**
   * IMPORTANT :
   *
   * Frontend/API :
   *   path
   *
   * Base de données :
   *   endpoint_path
   */
  if (pathFilter) {
    where.endpoint_path = {
      [Op.like]: `%${pathFilter}%`,
    };
  }

  /**
   * Filtre par status code.
   */
  if (query.status_code) {
    const statusCode = Number(query.status_code);

    if (Number.isInteger(statusCode)) {
      where.status_code = statusCode;
    }
  }

  /**
   * Filtre par date de début.
   */
  if (query.from) {
    and.push({
      created_at: {
        [Op.gte]: new Date(query.from),
      },
    });
  }

  /**
   * Filtre par date de fin.
   */
  if (query.to) {
    and.push({
      created_at: {
        [Op.lte]: new Date(query.to),
      },
    });
  }

  if (and.length > 0) {
    where[Op.and] = and;
  }

  return where;
}

/**
 * ============================================================
 * SERIALIZATION
 * ============================================================
 *
 * La DB utilise :
 *   http_method
 *   endpoint_path
 *
 * L'API continue de renvoyer :
 *   method
 *   path
 *
 * Cela évite de casser le frontend existant.
 */

function serializeLog(entry) {
  return {
    id: entry.id,

    created_at: entry.created_at,

    method: entry.http_method,

    path: entry.endpoint_path,

    resource: getResource(
      entry.endpoint_path
    ),

    status_code: entry.status_code,

    risk: getRisk(
      entry.status_code,
      entry.http_method
    ),

    ip_address: entry.ip_address,

    user_agent: entry.user_agent,

    metadata: entry.metadata,

    User: entry.User
      ? {
          id: entry.User.id,
          username: entry.User.username,
          email: entry.User.email,
        }
      : null,
  };
}

/**
 * ============================================================
 * SUMMARY
 * ============================================================
 */

function summarize(logs) {
  return logs.reduce(
    (acc, entry) => {
      acc.total += 1;

      acc.methods[entry.method] =
        (acc.methods[entry.method] || 0) + 1;

      acc.resources[entry.resource] =
        (acc.resources[entry.resource] || 0) + 1;

      if (entry.risk === 'critique') {
        acc.critique += 1;
      }

      if (entry.risk === 'attention') {
        acc.attention += 1;
      }

      if (entry.risk === 'mutation') {
        acc.mutations += 1;
      }

      if (entry.status_code >= 200 && entry.status_code < 300) {
        acc.success += 1;
      }

      if (entry.status_code >= 400 && entry.status_code < 500) {
        acc.client_errors += 1;
      }

      if (entry.status_code >= 500) {
        acc.server_errors += 1;
      }

      return acc;
    },
    {
      total: 0,

      success: 0,

      client_errors: 0,

      server_errors: 0,

      critique: 0,

      attention: 0,

      mutations: 0,

      methods: {},

      resources: {},
    }
  );
}

/**
 * ============================================================
 * GET LOGS
 * ============================================================
 */

router.get('/', async (req, res) => {
  try {
    const where = buildWhere(req.query);

    const page = Math.max(
      Number(req.query.page) || 1,
      1
    );

    const limit = Math.min(
      Math.max(
        Number(req.query.limit) || 50,
        1
      ),
      500
    );

    const offset = (page - 1) * limit;

    const { count, rows } =
      await AuditLog.findAndCountAll({
        where,

        include: [
          {
            model: User,
            attributes: [
              'id',
              'username',
              'email',
            ],
            required: false,
          },
        ],

        order: [
          ['created_at', 'DESC'],
        ],

        limit,

        offset,
      });

    const logs = rows.map(serializeLog);

    return res.json({
      success: true,

      data: logs,

      pagination: {
        page,

        limit,

        total: count,

        total_pages: Math.ceil(
          count / limit
        ),
      },

      summary: summarize(logs),
    });
  } catch (error) {
    console.error(
      'GET /logs error:',
      error
    );

    return res.status(500).json({
      success: false,

      message:
        'Impossible de récupérer les logs.',

      error:
        process.env.NODE_ENV === 'development'
          ? error.message
          : undefined,
    });
  }
});

/**
 * ============================================================
 * GET LOG BY ID
 * ============================================================
 */

router.get('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de log invalide.',
      });
    }

    const entry = await AuditLog.findByPk(
      id,
      {
        include: [
          {
            model: User,
            attributes: [
              'id',
              'username',
              'email',
            ],
            required: false,
          },
        ],
      }
    );

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Log introuvable.',
      });
    }

    return res.json({
      success: true,

      data: serializeLog(entry),
    });
  } catch (error) {
    console.error(
      'GET /logs/:id error:',
      error
    );

    return res.status(500).json({
      success: false,

      message:
        'Impossible de récupérer le log.',
    });
  }
});

/**
 * ============================================================
 * SUMMARY
 * ============================================================
 */

router.get('/stats/summary', async (req, res) => {
  try {
    const where = buildWhere(req.query);

    const entries = await AuditLog.findAll({
      where,

      include: [
        {
          model: User,
          attributes: [
            'id',
            'username',
            'email',
          ],
          required: false,
        },
      ],

      order: [
        ['created_at', 'DESC'],
      ],

      limit: 5000,
    });

    const logs = entries.map(
      serializeLog
    );

    return res.json({
      success: true,

      data: summarize(logs),
    });
  } catch (error) {
    console.error(
      'GET /logs/stats/summary error:',
      error
    );

    return res.status(500).json({
      success: false,

      message:
        'Impossible de calculer les statistiques.',
    });
  }
});

/**
 * ============================================================
 * CSV EXPORT
 * ============================================================
 */

router.get('/export/csv', async (req, res) => {
  try {
    const where = buildWhere(req.query);

    const entries = await AuditLog.findAll({
      where,

      include: [
        {
          model: User,
          attributes: [
            'id',
            'username',
            'email',
          ],
          required: false,
        },
      ],

      order: [
        ['created_at', 'DESC'],
      ],

      limit: 10000,
    });

    const logs = entries.map(
      serializeLog
    );

    const escapeCsv = (value) => {
      if (value === null || value === undefined) {
        return '';
      }

      let output;

      if (typeof value === 'object') {
        output = JSON.stringify(value);
      } else {
        output = String(value);
      }

      return `"${output.replace(/"/g, '""')}"`;
    };

    const lines = [];

    lines.push(
      CSV_FIELDS.join(',')
    );

    for (const log of logs) {
      lines.push(
        CSV_FIELDS.map((field) => {
          if (field === 'user') {
            return escapeCsv(
              log.User?.username || ''
            );
          }

          if (field === 'email') {
            return escapeCsv(
              log.User?.email || ''
            );
          }

          return escapeCsv(
            log[field]
          );
        }).join(',')
      );
    }

    const csv = lines.join('\n');

    res.setHeader(
      'Content-Type',
      'text/csv; charset=utf-8'
    );

    res.setHeader(
      'Content-Disposition',
      'attachment; filename="audit_logs.csv"'
    );

    return res.send(csv);
  } catch (error) {
    console.error(
      'GET /logs/export/csv error:',
      error
    );

    return res.status(500).json({
      success: false,

      message:
        'Impossible d’exporter les logs.',
    });
  }
});

/**
 * ============================================================
 * DASHBOARD HTML
 * ============================================================
 *
 * IMPORTANT :
 *
 * Si ton fichier original contient ici ton gros dashboard
 * HTML/CSS/JavaScript, conserve-le à cet emplacement.
 *
 * La partie API ci-dessus est la partie qui devait être
 * corrigée pour correspondre au schéma SQL.
 */

router.get('/viewer', (req, res) => {
  return res.sendFile(
    path.join(
      __dirname,
      '../public/logs.html'
    )
  );
});

module.exports = router;