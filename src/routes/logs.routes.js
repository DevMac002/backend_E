const express = require('express');
const path = require('path');
const { AuditLog, User, Op } = require('../models');

const router = express.Router();

router.use('/assets', express.static(path.join(__dirname, '../../public/logs'), { maxAge: '7d', immutable: true }));

router.get('/api', async (req, res) => {
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
    // This route intentionally remains public. Do not expose user-agent or
    // query metadata here: they can contain personal or sensitive data.
    const data = rows.map((entry) => ({
      id: entry.id,
      created_at: entry.created_at,
      method: entry.method,
      path: entry.path,
      status_code: entry.status_code,
      ip_address: entry.ip_address ? 'Masquée' : null,
      User: entry.User ? { id: entry.User.id, username: entry.User.username } : null,
    }));
    return res.json({ data, pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) } });
  } catch (error) {
    console.error('Unable to read audit logs:', error);
    return res.status(500).json({ message: 'Lecture des logs impossible. Vérifiez que la migration est appliquée.' });
  }
});

router.get('/', (_req, res) => {
  const nonce = res.locals.cspNonce;
  res.type('html').send(`<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Epika — Logs</title><link rel="icon" href="/logs/assets/log.png"><style nonce="${nonce}">*{box-sizing:border-box}body{font:15px system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;margin:0;min-height:100vh;color:#24243b;background:#46479f url('/logs/assets/preview.jpg') center/cover fixed no-repeat}body:before{content:'';position:fixed;inset:0;background:linear-gradient(115deg,rgba(36,37,105,.40),rgba(255,255,255,.08));pointer-events:none}main{position:relative;max-width:1120px;margin:auto;padding:42px 24px}.brand{display:flex;align-items:center;gap:14px;color:#fff;text-shadow:0 2px 8px #20205e}.brand img{width:60px;height:60px;object-fit:contain}.brand h1{margin:0;font-size:30px}.card{margin-top:28px;padding:28px;border:1px solid rgba(255,255,255,.65);border-radius:22px;background:rgba(255,255,255,.88);box-shadow:0 18px 45px rgba(22,22,55,.3);backdrop-filter:blur(9px)}input,button{font:inherit;padding:11px 13px;border-radius:9px;border:1px solid #c8c8dc;margin:3px}input{min-width:220px;background:#fff}button{border:0;background:#41449d;color:#fff;font-weight:700;cursor:pointer}button:hover{background:#2e307f}table{width:100%;border-collapse:collapse;margin-top:16px;background:#fff;border-radius:10px;overflow:hidden}td,th{border-bottom:1px solid #e1e1eb;padding:10px;text-align:left;vertical-align:top}th{background:#ececf7;color:#363674}code{white-space:pre-wrap}.hint{color:#5c5c75;margin-top:0}.live{display:inline-flex;align-items:center;gap:8px}.dot{width:9px;height:9px;border-radius:999px;background:#b94a48}.dot.on{background:#248a45}@media(max-width:700px){main{padding:26px 14px}.card{padding:18px;overflow:auto}.brand h1{font-size:24px}input{width:100%;margin:5px 0}table{font-size:12px;min-width:650px}}</style></head><body><main><header class="brand"><img src="/logs/assets/log.png" alt="Icône des logs"><div><h1>Journal d’audit Epika</h1><span>Consultation publique</span></div></header><section class="card"><p class="hint">Les entrées sont enregistrées automatiquement par l’API.</p><input id="filter" placeholder="Filtrer par chemin"><button id="refresh" type="button">Actualiser</button><p id="status"></p><p class="live"><span id="liveDot" class="dot"></span><span id="liveText">Connexion temps réel...</span></p><table><thead><tr><th>Date</th><th>Utilisateur</th><th>Requête</th><th>Statut</th><th>IP</th></tr></thead><tbody id="rows"></tbody></table></section><script nonce="${nonce}" src="/socket.io/socket.io.js"></script><script nonce="${nonce}">const rows=document.getElementById('rows');const statusEl=document.getElementById('status');const filterEl=document.getElementById('filter');const liveDot=document.getElementById('liveDot');const liveText=document.getElementById('liveText');let totalLogs=0;function cell(row,value,code){const el=document.createElement(code?'code':'td');el.textContent=value||'';if(code){const td=document.createElement('td');td.append(el);row.append(td)}else row.append(el)}function renderRow(x,prepend){const row=document.createElement('tr');row.dataset.id=x.id;cell(row,new Date(x.created_at).toLocaleString());cell(row,x.User?.username||'Anonyme');cell(row,x.method+' '+x.path,true);cell(row,String(x.status_code));cell(row,x.ip_address||'');if(prepend)rows.prepend(row);else rows.append(row)}function matchesFilter(x){const path=filterEl.value.trim().toLowerCase();return !path||String(x.path||'').toLowerCase().includes(path)}function setLive(on,text){liveDot.classList.toggle('on',on);liveText.textContent=text}async function loadLogs(){try{const path=filterEl.value;const result=await fetch('/logs/api?limit=100&path='+encodeURIComponent(path));const body=await result.json();totalLogs=result.ok?body.pagination.total:totalLogs;statusEl.textContent=result.ok?(totalLogs+' entrées'):(body.message||'Lecture impossible');rows.replaceChildren();if(result.ok)body.data.forEach(x=>renderRow(x,false))}catch(error){statusEl.textContent='Le serveur de logs est inaccessible.'}}document.getElementById('refresh').addEventListener('click',loadLogs);filterEl.addEventListener('input',loadLogs);loadLogs();if(window.io){const socket=io('/logs-realtime',{transports:['websocket','polling']});socket.on('connect',()=>setLive(true,'Temps réel actif'));socket.on('disconnect',()=>setLive(false,'Temps réel déconnecté'));socket.on('connect_error',()=>setLive(false,'Temps réel indisponible'));socket.on('audit:created',(entry)=>{totalLogs+=1;statusEl.textContent=totalLogs+' entrées';if(!matchesFilter(entry))return;if(rows.querySelector('[data-id="'+entry.id+'"]'))return;renderRow(entry,true);while(rows.children.length>100)rows.lastElementChild.remove()})}else{setLive(false,'Temps réel indisponible')}setInterval(loadLogs,30000)</script></main></body></html>`);
});

module.exports = router;
