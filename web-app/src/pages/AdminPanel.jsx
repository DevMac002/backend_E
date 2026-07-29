import { useEffect, useState } from 'react';
import api from '../api';
import AppLayout from '../components/AppLayout';
import { StatsSkeleton } from '../components/LoadingSkeleton';
import { useAuth } from '../hooks/useAuth';
import { Users, FileText, UsersRound, MessageSquare, ShieldCheck, LayoutDashboard, ScrollText, AlertCircle, Save, Settings2, Upload, ExternalLink, Image as ImageIcon, RotateCcw } from 'lucide-react';
import { DEFAULT_CHURCH_CONTENT } from './Home';

const STAT_CONFIGS = [
  { key: 'total_users',    label: 'Utilisateurs', icon: <Users size={24} color="white" />, iconBg: 'linear-gradient(135deg,#7C3AED,#A855F7)' },
  { key: 'total_posts',   label: 'Publications',  icon: <FileText size={24} color="white" />, iconBg: 'linear-gradient(135deg,#F59E0B,#F97316)' },
  { key: 'total_groups',  label: 'Groupes',       icon: <UsersRound size={24} color="white" />, iconBg: 'linear-gradient(135deg,#10B981,#34D399)' },
  { key: 'total_messages',label: 'Messages',      icon: <MessageSquare size={24} color="white" />, iconBg: 'linear-gradient(135deg,#3B82F6,#60A5FA)' },
];

function formatNum(n) {
  if (!n && n !== 0) return '—';
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return String(n);
}

function getBadgeClass(action = '') {
  const a = action.toLowerCase();
  if (a.includes('delete') || a.includes('ban') || a.includes('remove')) return 'badge badge-red';
  if (a.includes('create') || a.includes('add')) return 'badge badge-green';
  if (a.includes('warn') || a.includes('flag')) return 'badge badge-gold';
  return 'badge badge-purple';
}

export default function AdminPanel() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [siteContent, setSiteContent] = useState(DEFAULT_CHURCH_CONTENT);
  const [siteSaving, setSiteSaving] = useState(false);
  const [siteUploading, setSiteUploading] = useState(false);
  const [siteMessage, setSiteMessage] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/admin/stats'),
      api.get('/admin/logs'),
    ])
      .then(([statsRes, logsRes]) => {
        setStats(statsRes.data);
        setLogs(logsRes.data.moderation || logsRes.data.items || []);
      })
      .catch(() => setError('Impossible de charger les données administrateur'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    api.get('/site/content')
      .then(({ data }) => data.content && setSiteContent({ ...DEFAULT_CHURCH_CONTENT, ...data.content }))
      .catch(() => setSiteMessage('Le contenu public est indisponible pour le moment.'));
  }, []);

  const TABS = [
    { id: 'overview', label: <><LayoutDashboard size={16} /> Vue d'ensemble</> },
    { id: 'site',     label: <><Settings2 size={16} /> Accueil de l'église</> },
    { id: 'logs',     label: <><ScrollText size={16} /> Logs de modération</> },
  ];

  const updateSiteField = (field, value) => setSiteContent((current) => ({ ...current, [field]: value }));
  const resetSite = () => {
    setSiteContent(DEFAULT_CHURCH_CONTENT);
    setSiteMessage('Les valeurs par défaut ont été restaurées dans le formulaire. Publiez pour les rendre publiques.');
  };
  const uploadSiteImage = async (event, target) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setSiteUploading(true);
    setSiteMessage('Téléversement de l’image…');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await api.post('/site/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (target === 'hero') updateSiteField('heroImage', data.url);
      else setSiteContent((current) => ({ ...current, gallery: [...(current.gallery || []), data.url] }));
      setSiteMessage('Image téléversée. Publiez maintenant les changements.');
    } catch (requestError) {
      setSiteMessage(requestError.response?.data?.message || 'Le téléversement a échoué.');
    } finally {
      setSiteUploading(false);
      event.target.value = '';
    }
  };
  const saveSite = async (event) => {
    event.preventDefault();
    setSiteSaving(true);
    setSiteMessage('');
    try {
      await api.put('/site/content', { content: siteContent });
      setSiteMessage('Les informations de l’accueil ont été publiées.');
    } catch (requestError) {
      setSiteMessage(requestError.response?.data?.message || 'La publication a échoué.');
    } finally {
      setSiteSaving(false);
    }
  };

  return (
    <AppLayout>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Administration</h1>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 4 }}>
            Connecté en tant que{' '}
            <span style={{ color: 'var(--gold)', fontWeight: 700 }}>
              {user?.status || 'admin'}
            </span>
          </div>
        </div>
        <ShieldCheck size={32} color="var(--primary)" />
      </div>

      {error && <div className="error-box"><AlertCircle size={18} /> {error}</div>}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'var(--glass)', padding: 4, borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', width: 'fit-content' }}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '8px 16px',
              borderRadius: 'calc(var(--radius-md) - 4px)',
              border: 'none',
              background: activeTab === tab.id ? 'var(--bg-elevated)' : 'transparent',
              color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-muted)',
              fontWeight: activeTab === tab.id ? 700 : 500,
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: activeTab === tab.id ? 'var(--shadow-sm)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="admin-section">
          {loading ? (
            <StatsSkeleton />
          ) : (
            <div className="stats-grid">
              {STAT_CONFIGS.map((cfg, i) => (
                <div
                  key={cfg.key}
                  className="stat-card"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <div className="stat-card-icon" style={{ background: cfg.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {cfg.icon}
                  </div>
                  <div className="stat-card-value">{formatNum(stats?.[cfg.key])}</div>
                  <div className="stat-card-label">{cfg.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Health indicator */}
          {stats && (
            <div className="card" style={{ marginTop: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: 'var(--green)',
                  boxShadow: '0 0 8px var(--green)',
                  animation: 'pulse-glow 2s ease-in-out infinite',
                }} />
                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Service opérationnel</span>
                <span style={{ marginLeft: 'auto', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Dernière mise à jour : {new Date().toLocaleTimeString('fr-FR')}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'site' && (
        <form className="site-editor" onSubmit={saveSite}>
          <div className="site-editor-header"><div><div className="admin-section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Settings2 size={18} /> Gestion du site web</div><p className="site-editor-intro">Modifiez puis publiez les informations visibles sur la page officielle de l’église.</p></div><a className="site-preview-link" href="/" target="_blank" rel="noreferrer"><ExternalLink size={16} /> Ouvrir le site</a></div>
          {siteMessage && <div className="site-editor-message">{siteMessage}</div>}
          <div className="site-editor-layout"><div className="site-editor-grid">
            <div className="site-editor-section-title">Identité et bannière</div>
            <label className="form-group"><span className="form-label">Nom de l'église</span><input className="form-input" value={siteContent.churchName || ''} onChange={(e) => updateSiteField('churchName', e.target.value)} required /></label>
            <label className="form-group"><span className="form-label">Prochaine célébration</span><input className="form-input" value={siteContent.nextService || ''} onChange={(e) => updateSiteField('nextService', e.target.value)} required /></label>
            <label className="form-group site-editor-full"><span className="form-label">Titre de la bannière</span><input className="form-input" value={siteContent.tagline || ''} onChange={(e) => updateSiteField('tagline', e.target.value)} required /></label>
            <label className="form-group site-editor-full"><span className="form-label">Texte d’accueil</span><textarea className="form-input" rows="3" value={siteContent.description || ''} onChange={(e) => updateSiteField('description', e.target.value)} required /></label>
            <label className="form-group site-editor-full"><span className="form-label">URL de la photo de bannière</span><input className="form-input" type="url" value={siteContent.heroImage || ''} onChange={(e) => updateSiteField('heroImage', e.target.value)} /></label>
            <label className="site-upload-control site-editor-full"><Upload size={17} />{siteUploading ? 'Téléversement…' : 'Téléverser une nouvelle bannière'}<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => uploadSiteImage(event, 'hero')} disabled={siteUploading} /></label>
            <div className="site-editor-section-title">Coordonnées</div>
            <label className="form-group"><span className="form-label">Adresse</span><input className="form-input" value={siteContent.address || ''} onChange={(e) => updateSiteField('address', e.target.value)} required /></label>
            <label className="form-group"><span className="form-label">Lien Google Maps</span><input className="form-input" type="url" value={siteContent.mapUrl || ''} onChange={(e) => updateSiteField('mapUrl', e.target.value)} /></label>
            <label className="form-group"><span className="form-label">Téléphone</span><input className="form-input" value={siteContent.phone || ''} onChange={(e) => updateSiteField('phone', e.target.value)} /></label>
            <label className="form-group"><span className="form-label">Email</span><input className="form-input" type="email" value={siteContent.email || ''} onChange={(e) => updateSiteField('email', e.target.value)} /></label>
            <div className="site-editor-section-title">Contenus de la page</div>
            <label className="form-group"><span className="form-label">Titre du dernier message</span><input className="form-input" value={siteContent.messageTitle || ''} onChange={(e) => updateSiteField('messageTitle', e.target.value)} /></label>
            <label className="form-group"><span className="form-label">Référence du verset</span><input className="form-input" value={siteContent.verseReference || ''} onChange={(e) => updateSiteField('verseReference', e.target.value)} /></label>
            <label className="form-group site-editor-full"><span className="form-label">Verset du jour</span><textarea className="form-input" rows="2" value={siteContent.verseText || ''} onChange={(e) => updateSiteField('verseText', e.target.value)} /></label>
            <label className="form-group"><span className="form-label">Titre du bloc de prière</span><input className="form-input" value={siteContent.prayerTitle || ''} onChange={(e) => updateSiteField('prayerTitle', e.target.value)} /></label>
            <label className="form-group"><span className="form-label">Lieu des événements</span><input className="form-input" value={siteContent.serviceLocation || ''} onChange={(e) => updateSiteField('serviceLocation', e.target.value)} /></label>
            <label className="form-group site-editor-full"><span className="form-label">Texte du bloc de prière</span><textarea className="form-input" rows="2" value={siteContent.prayerDescription || ''} onChange={(e) => updateSiteField('prayerDescription', e.target.value)} /></label>
            <div className="site-editor-section-title">Galerie et événements</div>
            <label className="form-group site-editor-full"><span className="form-label">Photos de la galerie (une URL par ligne)</span><textarea className="form-input" rows="4" value={(siteContent.gallery || []).join('\n')} onChange={(e) => updateSiteField('gallery', e.target.value.split('\n').map((url) => url.trim()).filter(Boolean))} /></label>
            <label className="site-upload-control site-editor-full"><ImageIcon size={17} />{siteUploading ? 'Téléversement…' : 'Ajouter une photo à la galerie'}<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => uploadSiteImage(event, 'gallery')} disabled={siteUploading} /></label>
            <label className="form-group site-editor-full"><span className="form-label">Horaires (un rendez-vous par ligne : Jour | Heure | Intitulé)</span><textarea className="form-input" rows="4" value={(siteContent.schedule || []).map((event) => `${event.day} | ${event.time} | ${event.title}`).join('\n')} onChange={(e) => updateSiteField('schedule', e.target.value.split('\n').map((line) => line.split('|').map((part) => part.trim())).filter((parts) => parts.length === 3 && parts.every(Boolean)).map(([day, time, title]) => ({ day, time, title })))} /></label>
          </div><aside className="site-live-preview"><span>Prévisualisation de la bannière</span><img src={siteContent.heroImage} alt="Aperçu de la bannière" onError={(event) => { event.currentTarget.style.visibility = 'hidden'; }} /><strong>{siteContent.churchName || 'Nom de l’église'}</strong><h3>{siteContent.tagline || 'Titre de la bannière'}</h3><p>{siteContent.nextService}</p></aside></div>
          <div className="site-editor-actions"><button type="button" className="btn btn-ghost btn-lg" onClick={resetSite}><RotateCcw size={17} /> Réinitialiser</button><button type="submit" className="btn btn-primary btn-lg" disabled={siteSaving || siteUploading}><Save size={18} />{siteSaving ? 'Publication…' : 'Publier les changements'}</button></div>
        </form>
      )}

      {activeTab === 'logs' && (
        <div className="admin-section">
          <div className="admin-section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ScrollText size={18} /> Logs de modération
            <span style={{ marginLeft: 'auto', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 400 }}>
              {logs.length} entrée{logs.length !== 1 ? 's' : ''}
            </span>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, padding: '14px 18px', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                  <div className="skeleton" style={{ width: 80, height: 20, borderRadius: 20 }} />
                  <div className="skeleton skeleton-line" style={{ flex: 1 }} />
                  <div className="skeleton skeleton-line" style={{ width: 80 }} />
                </div>
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><ScrollText size={40} strokeWidth={1.5} /></div>
              <div className="empty-state-title">Aucun log disponible</div>
              <p className="empty-state-text">Les actions de modération apparaîtront ici.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="log-table">
                <thead>
                  <tr>
                    <th>Action</th>
                    <th>Détails</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <span className={getBadgeClass(row.action)}>
                          {row.action || 'Action'}
                        </span>
                      </td>
                      <td style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {row.metadata
                          ? (typeof row.metadata === 'string' ? row.metadata : JSON.stringify(row.metadata))
                          : '—'}
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        {row.created_at
                          ? new Date(row.created_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </AppLayout>
  );
}
