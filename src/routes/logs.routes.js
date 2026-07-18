const express = require('express');
const path = require('path');
const bcrypt = require('bcrypt');
const authMiddleware = require('../middlewares/auth.middleware');
const { requireNotBanned } = require('../middlewares/status.middleware');
const { requireRole } = require('../middlewares/role.middleware');
const { AuditLog, User, Op } = require('../models');
const { createSession } = require('../utils/sessions');
const { generateAccessToken } = require('../utils/token');
const { isTemporaryBlockActive } = require('../utils/user-access');

const router = express.Router();

router.use('/assets', express.static(path.join(__dirname, '../../public/logs'), { maxAge: '7d', immutable: true }));

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email et mot de passe requis' });
    const user = await User.findOne({ where: { email: String(email).trim().toLowerCase() } });
    if (!user || user.is_banned || isTemporaryBlockActive(user)) return res.status(401).json({ message: 'Identifiants invalides ou compte inaccessible' });
    if (!['admin', 'superadmin'].includes(user.status)) return res.status(403).json({ message: 'Accès réservé aux administrateurs' });
    const passwordValid = await bcrypt.compare(password, user.password_hash);
    if (!passwordValid) return res.status(401).json({ message: 'Mot de passe invalide' });
    const session = await createSession(user, req, 'logs-dashboard');
    return res.json({ accessToken: generateAccessToken(user, session), user: { id: user.id, username: user.username, status: user.status } });
  } catch (error) {
    console.error('Logs login failed:', error);
    const isMissingMigration = error?.original?.code === 'ER_NO_SUCH_TABLE' || error?.parent?.code === 'ER_NO_SUCH_TABLE';
    return res.status(500).json({
      message: isMissingMigration
        ? 'Le service de logs n’est pas initialisé : appliquez la migration de base de données puis redémarrez le serveur.'
        : 'Connexion au service de logs impossible. Consultez les logs serveur.',
    });
  }
});

router.get('/api', authMiddleware, requireNotBanned, requireRole('admin', 'superadmin'), async (req, res) => {
  try {
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
    return res.json({ data: rows, pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) } });
  } catch (error) {
    console.error('Unable to read audit logs:', error);
    return res.status(500).json({ message: 'Lecture des logs impossible. Vérifiez que la migration est appliquée.' });
  }
});

router.get('/', (_req, res) => {
  res.type('html').send(`<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Epika — Logs</title><link rel="icon" href="/logs/assets/log.png"><style>*{box-sizing:border-box}body{font:15px system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;margin:0;min-height:100vh;color:#24243b;background:#46479f url('/logs/assets/preview.jpg') center/cover fixed no-repeat}body:before{content:'';position:fixed;inset:0;background:linear-gradient(115deg,rgba(36,37,105,.40),rgba(255,255,255,.08));pointer-events:none}main{position:relative;max-width:1120px;margin:auto;padding:42px 24px}.brand{display:flex;align-items:center;gap:14px;color:#fff;text-shadow:0 2px 8px #20205e}.brand img{width:60px;height:60px;object-fit:contain}.brand h1{margin:0;font-size:30px}.card{margin-top:28px;padding:28px;border:1px solid rgba(255,255,255,.65);border-radius:22px;background:rgba(255,255,255,.88);box-shadow:0 18px 45px rgba(22,22,55,.3);backdrop-filter:blur(9px)}input,button{font:inherit;padding:11px 13px;border-radius:9px;border:1px solid #c8c8dc;margin:3px}input{min-width:220px;background:#fff}button{border:0;background:#41449d;color:#fff;font-weight:700;cursor:pointer}button:hover{background:#2e307f}button:last-of-type{background:#65657a}table{width:100%;border-collapse:collapse;margin-top:16px;background:#fff;border-radius:10px;overflow:hidden}td,th{border-bottom:1px solid #e1e1eb;padding:10px;text-align:left;vertical-align:top}th{background:#ececf7;color:#363674}code{white-space:pre-wrap}#viewer{display:none}.hint{color:#5c5c75;margin-top:0}@media(max-width:700px){main{padding:26px 14px}.card{padding:18px;overflow:auto}.brand h1{font-size:24px}input{width:100%;margin:5px 0}table{font-size:12px;min-width:650px}}</style></head><body><main><header class="brand"><img src="/logs/assets/log.png" alt="Icône des logs"><div><h1>Journal d’audit Epika</h1><span>Console d’administration</span></div></header><section id="login" class="card"><p class="hint">Connectez-vous avec un compte administrateur.</p><form onsubmit="login(event)"><input id="email" type="email" placeholder="Email" required><input id="password" type="password" placeholder="Mot de passe" required><button>Se connecter</button></form></section><section id="viewer" class="card"><p id="identity"></p><input id="filter" placeholder="Filtrer par chemin"><button onclick="loadLogs()">Actualiser</button><button onclick="logout()">Se déconnecter</button><p id="status"></p><table><thead><tr><th>Date</th><th>Utilisateur</th><th>Requête</th><th>Statut</th><th>IP</th></tr></thead><tbody id="rows"></tbody></table></section><script>let token='';async function login(event){event.preventDefault();const result=await fetch('/logs/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:document.getElementById('email').value,password:document.getElementById('password').value})});const body=await result.json();if(!result.ok)return alert(body.message||'Connexion refusée');token=body.accessToken;document.getElementById('login').style.display='none';document.getElementById('viewer').style.display='block';document.getElementById('identity').textContent='Connecté : '+body.user.username+' ('+body.user.status+')';loadLogs()}async function loadLogs(){const path=document.getElementById('filter').value;const result=await fetch('/logs/api?limit=100&path='+encodeURIComponent(path),{headers:{Authorization:'Bearer '+token}});const body=await result.json();document.getElementById('status').textContent=result.ok?(body.pagination.total+' entrées'):(body.message||'Accès refusé');document.getElementById('rows').innerHTML=result.ok?body.data.map(x=>'<tr><td>'+new Date(x.created_at).toLocaleString()+'</td><td>'+(x.User?.username||'Anonyme')+'</td><td><code>'+x.method+' '+x.path+'</code></td><td>'+x.status_code+'</td><td>'+x.ip_address+'</td></tr>').join(''):''}function logout(){token='';document.getElementById('viewer').style.display='none';document.getElementById('login').style.display='block';document.getElementById('password').value=''}</script></main></body></html>`);
});

module.exports = router;
