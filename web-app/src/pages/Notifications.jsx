import { useEffect, useState } from 'react';
import api from '../api';
import NavBar from '../components/NavBar';
import { useAuth } from '../hooks/useAuth';

export default function Notifications() {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/notifications')
      .then((response) => setNotifications(response.data.items || []))
      .catch(() => setError('Impossible de charger les notifications'));
  }, []);

  return (
    <div className="page">
      <NavBar user={user} onLogout={logout} />
      <main>
        <h1>Notifications</h1>
        {error && <div className="error">{error}</div>}
        {notifications.length === 0 ? (
          <p>Aucune notification.</p>
        ) : (
          <ul className="item-list">
            {notifications.map((notification) => (
              <li key={notification.id} className={notification.isRead ? 'read' : 'unread'}>
                <strong>{notification.type}</strong>
                <p>{notification.content}</p>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
