import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Home,
  User as UserIcon,
  Users,
  MessageSquare,
  Bell,
  LogOut,
  PlusCircle,
  Sparkles,
} from 'lucide-react';

export default function AppLayout({ children, onCreatePost }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { to: '/', icon: Home, label: 'Accueil' },
    { to: '/stories', icon: Sparkles, label: 'Stories' },
    { to: '/groups', icon: Users, label: 'Groupes' },
    { to: '/messages', icon: MessageSquare, label: 'Messages' },
    { to: '/notifications', icon: Bell, label: 'Notifications' },
    { to: '/profile', icon: UserIcon, label: 'Profil' },
  ];

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="sidebar-brand">
          <span className="brand-logo">✦</span>
          <span className="brand-name">Epika Social</span>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
              <Icon size={20} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <button className="btn btn-primary btn-full btn-compose" onClick={onCreatePost}>
          <PlusCircle size={18} />
          <span>Créer une publication</span>
        </button>

        <div className="sidebar-footer">
          <div className="user-mini-card" onClick={() => navigate('/profile')} role="button">
            <div className="avatar avatar-sm">
              {user?.avatar_path ? (
                <img src={user.avatar_path} alt={user.username} />
              ) : (
                <span>{user?.username?.[0]?.toUpperCase() ?? '?'}</span>
              )}
            </div>
            <div className="user-mini-info">
              <div className="user-mini-name">@{user?.username ?? '...'}</div>
              <div className="user-mini-role">{user?.role ?? ''}</div>
            </div>
          </div>
          <button className="btn btn-ghost btn-logout" onClick={logout} aria-label="Déconnexion">
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      <main className="app-main">
        <header className="app-header">
          <h1 className="page-title">Epika Social</h1>
          <div className="header-actions" />
        </header>
        <div className="app-content">{children}</div>
      </main>
    </div>
  );
}
