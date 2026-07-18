const express = require('express');
const path = require('path');
const { AuditLog, User, Op } = require('../models');

const router = express.Router();

const METHODS = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);
const CSV_FIELDS = ['id', 'created_at', 'method', 'path', 'status_code', 'risk', 'user', 'ip_address'];

router.use('/assets', express.static(path.join(__dirname, '../../public/logs'), { maxAge: '7d', immutable: true }));

function parseDate(value) {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
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

function buildWhere(query) {
  const where = {};
  const and = [];
  const method = String(query.method || '').toUpperCase();
  const statusFrom = Number(query.status_from);
  const statusTo = Number(query.status_to);
  const from = parseDate(query.from);
  const to = parseDate(query.to);
  const pathFilter = String(query.path || query.q || '').trim();

  if (METHODS.has(method)) where.method = method;
  if (query.user_id) where.user_id = Number(query.user_id);
  if (pathFilter) where.path = { [Op.like]: `%${pathFilter}%` };
  if (Number.isFinite(statusFrom) || Number.isFinite(statusTo)) {
    where.status_code = {};
    if (Number.isFinite(statusFrom)) where.status_code[Op.gte] = statusFrom;
    if (Number.isFinite(statusTo)) where.status_code[Op.lte] = statusTo;
  }
  if (from || to) {
    const range = {};
    if (from) range[Op.gte] = from;
    if (to) range[Op.lte] = to;
    and.push({ created_at: range });
  }
  if (and.length) where[Op.and] = and;
  return where;
}

function serializeLog(entry) {
  return {
    id: entry.id,
    created_at: entry.created_at,
    method: entry.method,
    path: entry.path,
    resource: getResource(entry.path),
    status_code: entry.status_code,
    risk: getRisk(entry.status_code, entry.method),
    ip_address: entry.ip_address ? 'Masquee' : null,
    User: entry.User ? { id: entry.User.id, username: entry.User.username } : null,
  };
}

function summarize(logs) {
  return logs.reduce((acc, entry) => {
    acc.total += 1;
    acc.methods[entry.method] = (acc.methods[entry.method] || 0) + 1;
    acc.resources[entry.resource] = (acc.resources[entry.resource] || 0) + 1;
    if (entry.status_code >= 500) acc.serverErrors += 1;
    else if (entry.status_code >= 400) acc.clientErrors += 1;
    else if (entry.status_code >= 300) acc.redirects += 1;
    else acc.success += 1;
    acc.risks[entry.risk] = (acc.risks[entry.risk] || 0) + 1;
    return acc;
  }, {
    total: 0,
    success: 0,
    redirects: 0,
    clientErrors: 0,
    serverErrors: 0,
    methods: {},
    resources: {},
    risks: {},
  });
}

function escapeCsv(value) {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function toCsv(logs) {
  const lines = [CSV_FIELDS.join(',')];
  logs.forEach((entry) => {
    lines.push(CSV_FIELDS.map((field) => {
      if (field === 'user') return escapeCsv(entry.User?.username || 'Anonyme');
      return escapeCsv(entry[field]);
    }).join(','));
  });
  return lines.join('\n');
}

router.get('/api', async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 250);
    const where = buildWhere(req.query);
    const { count, rows } = await AuditLog.findAndCountAll({
      where,
      include: [{ model: User, attributes: ['id', 'username'] }],
      order: [['created_at', 'DESC']],
      limit,
      offset: (page - 1) * limit,
    });
    const data = rows.map(serializeLog);
    return res.json({
      data,
      summary: summarize(data),
      pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) || 1 },
    });
  } catch (error) {
    console.error('Unable to read audit logs:', error);
    return res.status(500).json({ message: 'Lecture des logs impossible. Verifiez que la migration est appliquee.' });
  }
});

router.get('/export', async (req, res) => {
  try {
    const format = String(req.query.format || 'csv').toLowerCase();
    const limit = Math.min(Math.max(Number(req.query.limit) || 1000, 1), 5000);
    const rows = await AuditLog.findAll({
      where: buildWhere(req.query),
      include: [{ model: User, attributes: ['id', 'username'] }],
      order: [['created_at', 'DESC']],
      limit,
    });
    const data = rows.map(serializeLog);
    if (format === 'json') return res.json({ data, summary: summarize(data), exported_at: new Date().toISOString() });
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="epika-audit-logs.csv"');
    return res.send(toCsv(data));
  } catch (error) {
    console.error('Unable to export audit logs:', error);
    return res.status(500).json({ message: 'Export des logs impossible.' });
  }
});

router.get('/', (_req, res) => {
  const nonce = res.locals.cspNonce;
  res.type('html').send(`<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Epika Audit</title>
  <link rel="icon" href="/logs/assets/log.png">
  <style nonce="${nonce}">
    :root{color-scheme:light;--ink:#151525;--muted:#68687d;--line:#dddded;--paper:#fff;--brand:#41449d;--ok:#247a4b;--warn:#a46300;--bad:#b43636;--critical:#7b1f4d}
    *{box-sizing:border-box}body{font:14px system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;margin:0;min-height:100vh;color:var(--ink);background:#e8ebf5}
    body:before{content:'';position:fixed;inset:0;background:linear-gradient(180deg,rgba(65,68,157,.14),rgba(255,255,255,.2));pointer-events:none}
    button,input,select{font:inherit}button{border:0;border-radius:8px;background:var(--brand);color:#fff;font-weight:700;padding:10px 12px;cursor:pointer}
    button.secondary{background:#eef0fa;color:#30336e;border:1px solid #cfd2ec}button.ghost{background:transparent;color:#30336e;border:1px solid #cfd2ec}button:disabled{opacity:.55;cursor:not-allowed}
    input,select{width:100%;border:1px solid #cfd2e8;border-radius:8px;background:#fff;color:var(--ink);padding:10px 11px}
    main{position:relative;max-width:1440px;margin:auto;padding:24px}.top{display:flex;justify-content:space-between;align-items:flex-start;gap:18px;margin-bottom:18px}
    .brand{display:flex;align-items:center;gap:14px}.brand img{width:50px;height:50px}.brand h1{margin:0;font-size:28px}.brand p{margin:4px 0 0;color:var(--muted)}
    .live{display:flex;gap:8px;align-items:center;background:#fff;border:1px solid var(--line);border-radius:999px;padding:8px 12px}.dot{width:9px;height:9px;border-radius:999px;background:#b94a48}.dot.on{background:var(--ok)}
    .panel{background:rgba(255,255,255,.94);border:1px solid var(--line);border-radius:8px;box-shadow:0 12px 35px rgba(24,28,70,.08)}
    .filters{display:grid;grid-template-columns:2fr repeat(5,1fr) auto;gap:10px;padding:14px;margin-bottom:14px}.actions{display:flex;gap:8px;align-items:center}
    .stats{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-bottom:14px}.stat{padding:14px}.stat span{display:block;color:var(--muted);font-size:12px;text-transform:uppercase;letter-spacing:.04em}.stat strong{font-size:26px}
    .layout{display:grid;grid-template-columns:minmax(0,1fr) 340px;gap:14px}.tableWrap{overflow:auto}.toolbar{display:flex;justify-content:space-between;align-items:center;padding:12px 14px;border-bottom:1px solid var(--line);gap:10px}.toolbar .left,.toolbar .right{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
    table{width:100%;border-collapse:collapse;min-width:860px}th,td{border-bottom:1px solid #e7e8f2;padding:10px;text-align:left;vertical-align:middle}th{background:#f6f7fc;color:#42436a;font-size:12px;text-transform:uppercase;letter-spacing:.03em}tr.selected{background:#eef1ff}
    .method,.risk,.status{display:inline-flex;align-items:center;justify-content:center;min-width:58px;border-radius:999px;padding:4px 8px;font-weight:800;font-size:12px}.method{background:#edf0ff;color:#30336e}
    .risk-normal{background:#edf7f1;color:var(--ok)}.risk-mutation{background:#fff5df;color:var(--warn)}.risk-attention{background:#fff0ec;color:#a6441f}.risk-critique{background:#fdebf2;color:var(--critical)}
    .status.ok{color:var(--ok)}.status.warn{color:var(--warn)}.status.bad{color:var(--bad)}code{white-space:pre-wrap;word-break:break-word}
    .side{padding:14px;position:sticky;top:14px;align-self:start}.side h2{font-size:17px;margin:0 0 10px}.empty{color:var(--muted);padding:18px;text-align:center}
    .detail{display:grid;gap:10px}.detail div{border:1px solid #e3e5f2;border-radius:8px;padding:10px;background:#fbfcff}.detail span{display:block;color:var(--muted);font-size:12px;margin-bottom:4px}
    .lists{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:14px}.mini{padding:12px}.mini h3{margin:0 0 10px;font-size:14px}.mini ol{margin:0;padding-left:22px}.mini li{margin:6px 0}.pager{display:flex;justify-content:flex-end;align-items:center;gap:8px;padding:12px 14px;border-top:1px solid var(--line)}
    @media(max-width:1050px){.filters{grid-template-columns:1fr 1fr}.actions{grid-column:1/-1}.stats{grid-template-columns:1fr 1fr}.layout{grid-template-columns:1fr}.side{position:static}.top{display:block}.live{width:max-content;margin-top:12px}}
    @media(max-width:620px){main{padding:14px}.filters,.stats,.lists{grid-template-columns:1fr}.toolbar{align-items:flex-start;flex-direction:column}.brand h1{font-size:23px}}
  </style>
</head>
<body>
  <main>
    <header class="top">
      <div class="brand"><img src="/logs/assets/log.png" alt=""><div><h1>Audit Log Epika</h1><p>Surveillance publique des requetes API, avec donnees sensibles masquees.</p></div></div>
      <div class="live"><span id="liveDot" class="dot"></span><span id="liveText">Connexion temps reel...</span></div>
    </header>
    <section class="panel filters">
      <input id="q" placeholder="Chemin, ressource ou mot cle">
      <select id="method"><option value="">Toutes methodes</option><option>GET</option><option>POST</option><option>PUT</option><option>PATCH</option><option>DELETE</option></select>
      <select id="statusRange"><option value="">Tous statuts</option><option value="200-299">2xx succes</option><option value="300-399">3xx redirection</option><option value="400-499">4xx erreur client</option><option value="500-599">5xx erreur serveur</option></select>
      <input id="from" type="datetime-local"><input id="to" type="datetime-local">
      <select id="limit"><option>50</option><option selected>100</option><option>250</option></select>
      <div class="actions"><button id="apply" type="button">Filtrer</button><button id="reset" class="secondary" type="button">Reset</button></div>
    </section>
    <section class="stats">
      <div class="panel stat"><span>Total</span><strong id="statTotal">0</strong></div><div class="panel stat"><span>Succes</span><strong id="statOk">0</strong></div><div class="panel stat"><span>4xx</span><strong id="statClient">0</strong></div><div class="panel stat"><span>5xx</span><strong id="statServer">0</strong></div><div class="panel stat"><span>Selection</span><strong id="statSelected">0</strong></div>
    </section>
    <section class="layout">
      <div class="panel">
        <div class="toolbar"><div class="left"><button id="selectAll" class="secondary" type="button">Tout selectionner</button><button id="clearSelection" class="ghost" type="button">Vider selection</button><span id="statusText"></span></div><div class="right"><button id="copySelected" class="secondary" type="button">Copier selection</button><button id="exportCsv" class="secondary" type="button">CSV</button><button id="exportJson" class="secondary" type="button">JSON</button><button id="refresh" type="button">Actualiser</button></div></div>
        <div class="tableWrap"><table><thead><tr><th><input id="masterCheck" type="checkbox"></th><th>Date</th><th>Methode</th><th>Requete</th><th>Ressource</th><th>Statut</th><th>Risque</th><th>Utilisateur</th><th>IP</th></tr></thead><tbody id="rows"><tr><td class="empty" colspan="9">Chargement...</td></tr></tbody></table></div>
        <div class="pager"><button id="prev" class="secondary" type="button">Precedent</button><span id="pageText">Page 1</span><button id="next" class="secondary" type="button">Suivant</button></div>
      </div>
      <aside class="panel side"><h2>Details</h2><div id="detail" class="empty">Selectionne une requete pour voir ses details.</div><div class="lists"><div class="mini panel"><h3>Top ressources</h3><ol id="resources"></ol></div><div class="mini panel"><h3>Methodes</h3><ol id="methods"></ol></div></div></aside>
    </section>
    <script nonce="${nonce}" src="/socket.io/socket.io.js"></script>
    <script nonce="${nonce}">
      const el=(id)=>document.getElementById(id);
      const state={page:1,totalPages:1,total:0,logs:[],selected:new Map()};
      const rows=el('rows');
      function params(){const query=new URLSearchParams({page:String(state.page),limit:el('limit').value});const q=el('q').value.trim();const method=el('method').value;const range=el('statusRange').value;const from=el('from').value;const to=el('to').value;if(q)query.set('q',q);if(method)query.set('method',method);if(range){const parts=range.split('-');query.set('status_from',parts[0]);query.set('status_to',parts[1])}if(from)query.set('from',new Date(from).toISOString());if(to)query.set('to',new Date(to).toISOString());return query}
      function clsStatus(code){if(code>=500)return'bad';if(code>=400)return'bad';if(code>=300)return'warn';return'ok'}
      function textUser(x){return x.User?.username||'Anonyme'}
      function renderCell(row,text,kind){const td=document.createElement('td');if(kind){const span=document.createElement(kind==='code'?'code':'span');span.className=kind==='risk'?'risk risk-'+text:kind;span.textContent=text;td.append(span)}else td.textContent=text||'';row.append(td)}
      function emptyRow(text){rows.replaceChildren();const tr=document.createElement('tr');const td=document.createElement('td');td.className='empty';td.colSpan=9;td.textContent=text;tr.append(td);rows.append(tr)}
      function renderRows(){rows.replaceChildren();if(!state.logs.length){emptyRow('Aucune entree pour ces filtres.');return}state.logs.forEach((x)=>{const tr=document.createElement('tr');tr.dataset.id=x.id;if(state.selected.has(String(x.id)))tr.classList.add('selected');const checkTd=document.createElement('td');const check=document.createElement('input');check.type='checkbox';check.checked=state.selected.has(String(x.id));check.addEventListener('change',()=>toggle(x,check.checked));checkTd.append(check);tr.append(checkTd);renderCell(tr,new Date(x.created_at).toLocaleString());renderCell(tr,x.method,'method');renderCell(tr,x.path,'code');renderCell(tr,x.resource);renderCell(tr,String(x.status_code),'status '+clsStatus(x.status_code));renderCell(tr,x.risk,'risk');renderCell(tr,textUser(x));renderCell(tr,x.ip_address||'');tr.addEventListener('click',(event)=>{if(event.target.tagName!=='INPUT')showDetail(x)});rows.append(tr)})}
      function renderStats(summary){el('statTotal').textContent=state.total;el('statOk').textContent=summary.success||0;el('statClient').textContent=summary.clientErrors||0;el('statServer').textContent=summary.serverErrors||0;el('statSelected').textContent=state.selected.size;el('statusText').textContent=state.total+' entrees trouvees';el('pageText').textContent='Page '+state.page+' / '+state.totalPages;el('prev').disabled=state.page<=1;el('next').disabled=state.page>=state.totalPages;renderList('resources',summary.resources);renderList('methods',summary.methods)}
      function renderList(id,items){const list=el(id);list.replaceChildren();Object.entries(items||{}).sort((a,b)=>b[1]-a[1]).slice(0,6).forEach(([key,value])=>{const li=document.createElement('li');li.textContent=key+' - '+value;list.append(li)});if(!list.children.length){const li=document.createElement('li');li.textContent='Aucune donnee';list.append(li)}}
      function toggle(log,checked){if(checked)state.selected.set(String(log.id),log);else state.selected.delete(String(log.id));el('statSelected').textContent=state.selected.size;renderRows();if(checked)showDetail(log)}
      function showDetail(x){const detail=el('detail');detail.className='detail';detail.replaceChildren();[['ID',x.id],['Date',new Date(x.created_at).toLocaleString()],['Utilisateur',textUser(x)],['Methode',x.method],['Chemin',x.path],['Ressource',x.resource],['Statut',x.status_code],['Risque',x.risk],['IP publique',x.ip_address||'']].forEach(([label,value])=>{const box=document.createElement('div');const small=document.createElement('span');small.textContent=label;const strong=document.createElement('strong');strong.textContent=value;box.append(small,strong);detail.append(box)})}
      async function load(){try{const response=await fetch('/logs/api?'+params().toString());const body=await response.json();if(!response.ok)throw new Error(body.message||'Lecture impossible');state.logs=body.data;state.total=body.pagination.total;state.totalPages=body.pagination.totalPages;renderRows();renderStats(body.summary)}catch(error){emptyRow(error.message||'Le serveur de logs est inaccessible.');el('statusText').textContent='Lecture impossible'}}
      function applyFilters(){state.page=1;load()}
      function exportUrl(format){const query=params();query.set('format',format);query.set('limit','5000');return '/logs/export?'+query.toString()}
      el('apply').addEventListener('click',applyFilters);el('refresh').addEventListener('click',load);el('reset').addEventListener('click',()=>{['q','method','statusRange','from','to'].forEach((id)=>{el(id).value=''});state.page=1;state.selected.clear();load()});el('prev').addEventListener('click',()=>{if(state.page>1){state.page-=1;load()}});el('next').addEventListener('click',()=>{if(state.page<state.totalPages){state.page+=1;load()}});el('selectAll').addEventListener('click',()=>{state.logs.forEach((x)=>state.selected.set(String(x.id),x));renderRows();el('statSelected').textContent=state.selected.size});el('clearSelection').addEventListener('click',()=>{state.selected.clear();renderRows();el('statSelected').textContent=0;el('detail').className='empty';el('detail').textContent='Selectionne une requete pour voir ses details.'});el('masterCheck').addEventListener('change',(event)=>{state.logs.forEach((x)=>{if(event.target.checked)state.selected.set(String(x.id),x);else state.selected.delete(String(x.id))});renderRows();el('statSelected').textContent=state.selected.size});el('copySelected').addEventListener('click',async()=>{const data=Array.from(state.selected.values());await navigator.clipboard.writeText(JSON.stringify(data,null,2));el('statusText').textContent=data.length+' entree(s) copiee(s)'});el('exportCsv').addEventListener('click',()=>{location.href=exportUrl('csv')});el('exportJson').addEventListener('click',()=>{location.href=exportUrl('json')});['q','method','statusRange','from','to','limit'].forEach((id)=>el(id).addEventListener('change',applyFilters));
      load();
      function setLive(on,text){el('liveDot').classList.toggle('on',on);el('liveText').textContent=text}
      if(window.io){const socket=io('/logs-realtime',{transports:['websocket','polling']});socket.on('connect',()=>setLive(true,'Temps reel actif'));socket.on('disconnect',()=>setLive(false,'Temps reel deconnecte'));socket.on('connect_error',()=>setLive(false,'Temps reel indisponible'));socket.on('audit:created',(entry)=>{state.total+=1;if(state.page===1){state.logs.unshift(entry);state.logs=state.logs.slice(0,Number(el('limit').value));renderRows()}el('statTotal').textContent=state.total;el('statusText').textContent='Nouvelle entree recue'})}else setLive(false,'Temps reel indisponible');
      setInterval(load,30000);
    </script>
  </main>
</body>
</html>`);
});

module.exports = router;
