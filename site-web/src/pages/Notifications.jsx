import { useCallback, useEffect, useState } from 'react';
import AppLayout from '../components/AppLayout';
import CreatePostModal from '../components/CreatePostModal';
import api from '../lib/api';
import { useToast } from '../components/Toast';
import { Bell, Heart, UserPlus, MessageSquare, Check, Sparkles, Inbox } from 'lucide-react';

function formatNotifTime(d) {
  if (!d) return '';
  try {
    const now = new Date();
    const diff = now - new Date(d);
    const min = Math.floor(diff / 60000);
    const hr = Math.floor(diff / 3600000);
    const day = Math.floor(diff / 86400000);
    if (min < 1) return 'À l\'instant';
    if (min < 60) return `${min} min`;
    if (hr < 24) return `${hr} h`;
    if (day < 7) return `${day} j`;
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  } catch { return ''; }
}

function iconFor(type) {
  switch (type) {
    case 'NEW_FOLLOWER': return UserPlus;
    case 'NEW_LIKE': return Heart;
    case 'NEW_COMMENT': return MessageSquare;
    case 'NEW_MESSAGE': return MessageSquare;
    default: return Bell;
  }
}

export default function Notifications() {
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openCreate, setOpenCreate] = useState(false);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [markingId, setMarkingId] = useState(null);

  const fetchNotifs = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const { data } = await api.get('/notifications', { params: { page, limit: 30 } });
      setNotifications(data.data || []);
      setMeta(data.meta || { page, limit: 30, totalPages: 1, total: data.data?.length ?? 0 });
    } catch (err) {
      showToast(err.response?.data?.message || 'Impossible de charger les notifications', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { fetchNotifs(1); }, [fetchNotifs]);

  const markRead = async (n) => {
    if (n.is_read || markingId) return;
    setMarkingId(n.id);
    try {
      await api.put(`/notifications/${n.id}/read`);
      setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)));
    } catch {
      /* ignore */
    } finally {
      setMarkingId(null);
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <AppLayout onCreatePost={() => setOpenCreate(true)}>
      <CreatePostModal open={openCreate} onClose={() => setOpenCreate(false)} />

      <div className="page-header">
        <h2>
          <Bell size={22} style={{ verticalAlign: 'middle', marginRight: 8, color: 'var(--primary-light)' }} />
          Notifications
          {unreadCount > 0 && (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: 22, height: 22, padding: '0 7px',
              background: 'var(--primary)',
              color: '#fff',
              borderRadius: 999,
              fontSize: '0.75rem',
              fontWeight: 700,
              marginLeft: 10,
              verticalAlign: 'middle',
            }}>
              {unreadCount}
            </span>
          )}
        </h2>
        {unreadCount > 0 && (
          <button
            className="btn btn-ghost"
            onClick={async () => {
              try {
                await Promise.all(notifications.filter((n) => !n.is_read).map((n) => api.put(`/notifications/${n.id}/read`)));
                setNotifications((prev) => prev.map((x) => ({ ...x, is_read: true })));
                showToast('Toutes les notifications marquées comme lues', 'success');
              } catch { showToast('Erreur', 'error'); }
            }}
          >
            <Check size={16} /> Tout marquer lu
          </button>
        )}
      </div>

      {loading ? (
        <div className="empty-state"><div className="splash-spinner" /></div>
      ) : notifications.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Sparkles size={28} /></div>
          <h3>Rien de nouveau</h3>
          <p>Vos notifications apparaîtront ici (nouveaux followers, likes, commentaires...).</p>
        </div>
      ) : (
        <div className="notif-list">
          {notifications.map((n) => {
            const Icon = iconFor(n.type);
            return (
              <div
                key={n.id}
                className={`notif-item${!n.is_read ? ' unread' : ''}`}
                onClick={() => markRead(n)}
              >
                <div className="notif-icon"><Icon size={18} /></div>
                <div className="notif-body">
                  <div className="notif-content">{n.content}</div>
                  <div className="notif-time">{formatNotifTime(n.created_at)}</div>
                </div>
                {!n.is_read && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)', flexShrink: 0 }} />}
              </div>
            );
          })}
        </div>
      )}

      {meta.totalPages > 1 && (
        <div className="pagination">
          <span style={{ color: 'var(--text-dim)', fontSize: '0.88rem' }}>
            {meta.total} notification{meta.total > 1 ? 's' : ''} · Page {meta.page} / {meta.totalPages}
          </span>
        </div>
      )}
    </AppLayout>
  );
}
