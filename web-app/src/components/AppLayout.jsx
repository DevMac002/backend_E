import SideBar from './SideBar';
import ToastContainer from './Toast';

const SUGGESTIONS = [
  { id: 1, name: 'Marie Dupont', meta: '✦ Modératrice', initials: 'MD' },
  { id: 2, name: 'Jean-Paul Morel', meta: '🙏 Évangéliste', initials: 'JP' },
  { id: 3, name: 'Sarah Kimani', meta: '🎵 Chant & Louange', initials: 'SK' },
  { id: 4, name: 'David Leclerc', meta: '📖 Étude biblique', initials: 'DL' },
];

const TRENDING = [
  { tag: '#Prière', count: '1.2k posts' },
  { tag: '#Louange', count: '842 posts' },
  { tag: '#Témoignage', count: '631 posts' },
  { tag: '#Annonce', count: '284 posts' },
];

function RightPanel() {
  return (
    <aside className="layout-panel">
      {/* Search */}
      <div className="search-bar">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input type="search" placeholder="Rechercher..." aria-label="Rechercher" />
      </div>

      {/* Trending */}
      <div className="panel-section">
        <div className="panel-title">🔥 Tendances</div>
        {TRENDING.map((t) => (
          <div key={t.tag} style={{
            padding: '10px 12px',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            transition: 'background 0.2s ease',
            marginBottom: 2,
          }}
            onMouseOver={(e) => e.currentTarget.style.background = 'var(--glass)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--primary-light)' }}>{t.tag}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{t.count}</div>
          </div>
        ))}
      </div>

      <div className="divider" />

      {/* Suggestions */}
      <div className="panel-section">
        <div className="panel-title">✨ Suggestions</div>
        {SUGGESTIONS.map((u) => (
          <div key={u.id} className="suggested-user">
            <div className="avatar avatar-sm">{u.initials}</div>
            <div className="suggested-user-info">
              <div className="suggested-user-name">{u.name}</div>
              <div className="suggested-user-meta">{u.meta}</div>
            </div>
            <button type="button" className="btn btn-ghost btn-sm">Suivre</button>
          </div>
        ))}
      </div>

      <div className="divider" />

      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 2 }}>
        Epika Social · Réseau chrétien<br />
        © 2026 · Conditions · Confidentialité
      </div>
    </aside>
  );
}

export default function AppLayout({ children, unreadCount = 0 }) {
  return (
    <div className="app-layout">
      <SideBar unreadCount={unreadCount} />
      <main className="layout-main">
        {children}
      </main>
      <RightPanel />
      <ToastContainer />
    </div>
  );
}
