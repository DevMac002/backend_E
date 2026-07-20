import { useEffect, useState } from 'react';
import api from '../api';
import AppLayout from '../components/AppLayout';
import { StatsSkeleton } from '../components/LoadingSkeleton';
import { useAuth } from '../hooks/useAuth';
import { Users, FileText, UsersRound, MessageSquare, ShieldCheck, LayoutDashboard, ScrollText, AlertCircle } from 'lucide-react';

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

  const TABS = [
    { id: 'overview', label: <><LayoutDashboard size={16} /> Vue d'ensemble</> },
    { id: 'logs',     label: <><ScrollText size={16} /> Logs de modération</> },
  ];

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
