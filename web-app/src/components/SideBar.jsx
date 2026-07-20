import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const NAV_LINKS = [
  {
    to: '/app',
    label: 'Feed',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    to: '/groups',
    label: 'Groupes',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87" />
        <path d="M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
  },
  {
    to: '/messages',
    label: 'Messages',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      </svg>
    ),
  },
  {
    to: '/notifications',
    label: 'Notifs',
    badge: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 01-3.46 0" />
      </svg>
    ),
  },
  {
    to: '/profile',
    label: 'Profil',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
];

const ADMIN_LINK = {
  to: '/admin',
  label: 'Admin',
  icon: (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
};

function Avatar({ user, size = 'md' }) {
  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : '?';
  return (
    <div className={`avatar avatar-${size}`}>{initials}</div>
  );
}

export default function SideBar({ unreadCount = 0 }) {
  const { user, logout } = useAuth();
  const location = useLocation();

  const links = [
    ...NAV_LINKS,
    ...(user?.status !== 'user' ? [ADMIN_LINK] : []),
  ];

  return (
    <aside className="layout-sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">✦</div>
        <span className="sidebar-logo-text">Epika</span>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {links.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className={`sidebar-link${location.pathname === link.to ? ' active' : ''}`}
          >
            {link.icon}
            <span>{link.label}</span>
            {link.badge && unreadCount > 0 && (
              <span className="sidebar-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
            )}
          </Link>
        ))}
      </nav>

      <div className="sidebar-divider" />

      {/* User footer */}
      <div className="sidebar-footer">
        {user && (
          <div className="sidebar-user">
            <Avatar user={user} size="sm" />
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user.username}</div>
              <div className="sidebar-user-handle">@{user.email?.split('@')[0]}</div>
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={logout}
          className="sidebar-link btn-danger logout-btn"
          style={{ marginTop: 4 }}
        >
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 20, height: 20 }}>
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span>Déconnexion</span>
        </button>
      </div>
    </aside>
  );
}
