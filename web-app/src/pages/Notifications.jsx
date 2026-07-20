import { useEffect, useState } from 'react';
import api from '../api';
import AppLayout from '../components/AppLayout';
import { useAuth } from '../hooks/useAuth';
import { Heart, MessageSquare, UserPlus, AtSign, Bell, AlertCircle, Check } from 'lucide-react';

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return 'À l\'instant';
  if (diff < 3600) return `${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} h`;
  return `${Math.floor(diff / 86400)} j`;
}

const NOTIF_ICONS = {
  like:     { icon: <Heart size={16} color="white" />, bg: 'notif-like' },
  comment:  { icon: <MessageSquare size={16} color="white" />, bg: 'notif-comment' },
  follow:   { icon: <UserPlus size={16} color="white" />, bg: 'notif-follow' },
  mention:  { icon: <AtSign size={16} color="white" />, bg: 'notif-mention' },
  default:  { icon: <Bell size={16} color="white" />, bg: 'notif-default' },
};

function getNotifStyle(type = '') {
  const key = type.toLowerCase();
  return NOTIF_ICONS[key] || NOTIF_ICONS.default;
}

export default function Notifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/notifications')
      .then((res) => setNotifications(res.data.items || []))
      .catch(() => setError('Impossible de charger les notifications'))
      .finally(() => setLoading(false));
  }, []);

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      // silent
    }
  };

  const markRead = async (id) => {
    setNotifications((prev) =>
      prev.map((n) => n.id === id ? { ...n, isRead: true } : n)
    );
    try {
      await api.put(`/notifications/${id}/read`);
    } catch {
      // silent revert could go here
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <AppLayout unreadCount={unreadCount}>
      <div className="page-header">
        <h1 className="page-title">
          Notifications
          {unreadCount > 0 && (
            <span className="sidebar-badge" style={{ marginLeft: 10, fontSize: '0.7rem' }}>
              {unreadCount}
            </span>
          )}
        </h1>
        {unreadCount > 0 && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={markAllRead}>
            <Check size={16} /> Tout marquer lu
          </button>
        )}
      </div>

      {error && <div className="error-box"><AlertCircle size={18} /> {error}</div>}

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, padding: '14px 16px' }}>
              <div className="skeleton skeleton-circle" style={{ width: 36, height: 36 }} />
              <div style={{ flex: 1 }}>
                <div className="skeleton skeleton-line" style={{ width: '70%', marginBottom: 6 }} />
                <div className="skeleton skeleton-line" style={{ width: '30%' }} />
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Bell size={40} strokeWidth={1.5} /></div>
          <div className="empty-state-title">Aucune notification</div>
          <p className="empty-state-text">Vous êtes à jour ! Les nouvelles activités apparaîtront ici.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {notifications.map((notif) => {
            const style = getNotifStyle(notif.type);
            return (
              <div
                key={notif.id}
                className={`notif-item${notif.isRead ? '' : ' unread'}`}
                onClick={() => !notif.isRead && markRead(notif.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && !notif.isRead && markRead(notif.id)}
                aria-label={`Notification: ${notif.content || notif.type}`}
              >
                <div className={`notif-icon ${style.bg}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {style.icon}
                </div>
                <div className="notif-content">
                  <div className="notif-text">
                    <strong>{notif.type || 'Notification'}</strong>
                    {notif.content && ` — ${notif.content}`}
                  </div>
                  <div className="notif-time">{timeAgo(notif.created_at || notif.createdAt)}</div>
                </div>
                {!notif.isRead && (
                  <div style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: 'var(--primary)',
                    flexShrink: 0,
                    alignSelf: 'center',
                  }} />
                )}
              </div>
            );
          })}
        </div>
      )}
    </AppLayout>
  );
}
