import { useEffect, useState } from 'react';
import api from '../api';
import NavBar from '../components/NavBar';
import { useAuth } from '../hooks/useAuth';

export default function AdminPanel() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api.get('/admin/stats'), api.get('/admin/logs')])
      .then(([statsRes, logsRes]) => {
        setStats(statsRes.data);
        setLogs(logsRes.data.moderation || []);
      })
      .catch(() => setError('Impossible de charger les données admin'));
  }, []);

  return (
    <div className="page">
      <NavBar user={user} onLogout={logout} />
      <main>
        <h1>Administration</h1>
        {error && <div className="error">{error}</div>}
        {stats ? (
          <div className="admin-grid">
            <div className="card"><h2>Utilisateurs</h2><p>{stats.total_users}</p></div>
            <div className="card"><h2>Publications</h2><p>{stats.total_posts}</p></div>
            <div className="card"><h2>Groupes</h2><p>{stats.total_groups}</p></div>
            <div className="card"><h2>Messages</h2><p>{stats.total_messages}</p></div>
          </div>
        ) : (
          <p>Chargement des statistiques...</p>
        )}
        <section>
          <h2>Derniers logs de modération</h2>
          {logs.length === 0 ? (
            <p>Aucun log disponible.</p>
          ) : (
            <ul className="item-list">
              {logs.map((row) => (
                <li key={row.id}>
                  <p><strong>{row.action}</strong></p>
                  <p>{row.metadata ? JSON.stringify(row.metadata) : ''}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
