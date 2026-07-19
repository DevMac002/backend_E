import { useEffect, useState } from 'react';
import api from '../api';
import NavBar from '../components/NavBar';
import { useAuth } from '../hooks/useAuth';

export default function Groups() {
  const { user, logout } = useAuth();
  const [groups, setGroups] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/groups')
      .then((response) => setGroups(response.data.items || []))
      .catch(() => setError('Impossible de charger les groupes'));
  }, []);

  return (
    <div className="page">
      <NavBar user={user} onLogout={logout} />
      <main>
        <h1>Groupes</h1>
        {error && <div className="error">{error}</div>}
        {groups.length === 0 ? (
          <p>Aucun groupe trouvé.</p>
        ) : (
          <ul className="item-list">
            {groups.map((group) => (
              <li key={group.id}>
                <strong>{group.name || group.nom || 'Groupe'}</strong>
                <p>{group.description}</p>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
