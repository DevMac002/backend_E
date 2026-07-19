import { useEffect, useState } from 'react';
import api from '../api';
import NavBar from '../components/NavBar';
import { useAuth } from '../hooks/useAuth';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/posts')
      .then((response) => setPosts(response.data.items || []))
      .catch(() => setError('Impossible de charger le feed'));
  }, []);

  return (
    <div className="page">
      <NavBar user={user} onLogout={logout} />
      <main>
        <h1>Fil d’actualité</h1>
        {error && <div className="error">{error}</div>}
        {posts.length === 0 ? (
          <p>Aucune publication pour le moment.</p>
        ) : (
          <ul className="item-list">
            {posts.map((post) => (
              <li key={post.id}>
                <strong>{post.type}</strong>
                <p>{post.content}</p>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
