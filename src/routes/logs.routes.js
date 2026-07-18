const express = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const { requireNotBanned } = require('../middlewares/status.middleware');
const { requireRole } = require('../middlewares/role.middleware');
const { AuditLog, User, Op } = require('../models');

const router = express.Router();

router.get('/api', authMiddleware, requireNotBanned, requireRole('superadmin'), async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 250);
  const where = {};
  if (req.query.user_id) where.user_id = Number(req.query.user_id);
  if (req.query.path) where.path = { [Op.like]: `%${req.query.path}%` };
  const { count, rows } = await AuditLog.findAndCountAll({
    where,
    include: [{ model: User, attributes: ['id', 'username', 'email'] }],
    order: [['created_at', 'DESC']],
    limit,
    offset: (page - 1) * limit,
  });
  res.json({ data: rows, pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) } });
});

router.get('/', (_req, res) => {
  res.type('html').send(`<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Epika — Logs</title><style>body{font:14px system-ui;margin:2rem;background:#111;color:#eee}input,button{padding:.65rem;margin:.2rem}table{width:100%;border-collapse:collapse;margin-top:1rem}td,th{border:1px solid #444;padding:.5rem;text-align:left;vertical-align:top}code{white-space:pre-wrap}</style></head><body><h1>Journal d’audit Epika</h1><p>Accès réservé aux superadministrateurs. Le jeton n’est pas enregistré.</p><input id="token" type="password" placeholder="Access token JWT" size="55"><input id="filter" placeholder="Filtrer par chemin"><button onclick="loadLogs()">Afficher les logs</button><p id="status"></p><table><thead><tr><th>Date</th><th>Utilisateur</th><th>Requête</th><th>Statut</th><th>IP</th></tr></thead><tbody id="rows"></tbody></table><script>async function loadLogs(){const token=document.getElementById('token').value;const path=document.getElementById('filter').value;const result=await fetch('/logs/api?limit=100&path='+encodeURIComponent(path),{headers:{Authorization:'Bearer '+token}});const body=await result.json();document.getElementById('status').textContent=result.ok?(body.pagination.total+' entrées'):(body.message||'Accès refusé');document.getElementById('rows').innerHTML=result.ok?body.data.map(x=>'<tr><td>'+new Date(x.created_at).toLocaleString()+'</td><td>'+(x.User?.username||'Anonyme')+'</td><td><code>'+x.method+' '+x.path+'</code></td><td>'+x.status_code+'</td><td>'+x.ip_address+'</td></tr>').join(''):''}</script></body></html>`);
});

module.exports = router;
