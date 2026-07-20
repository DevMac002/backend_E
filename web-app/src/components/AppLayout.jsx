import SideBar from './SideBar';
import ToastContainer from './Toast';
import { Search } from 'lucide-react';

function RightPanel() {
  return (
    <aside className="layout-panel">
      {/* Search */}
      <div className="search-bar">
        <Search size={18} />
        <input type="search" placeholder="Rechercher..." aria-label="Rechercher" />
      </div>

      <div className="empty-state" style={{ padding: '40px 10px', opacity: 0.7 }}>
        <div className="empty-state-title" style={{ fontSize: '0.9rem' }}>Espace découverte</div>
        <p className="empty-state-text" style={{ fontSize: '0.8rem' }}>Les suggestions et tendances apparaîtront ici.</p>
      </div>

      <div className="divider" style={{ marginTop: 'auto' }} />

      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 2, paddingBottom: 20 }}>
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
