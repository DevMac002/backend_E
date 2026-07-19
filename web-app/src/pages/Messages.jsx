import { useEffect, useState } from 'react';
import api from '../api';
import NavBar from '../components/NavBar';
import { useAuth } from '../hooks/useAuth';

export default function Messages() {
  const { user, logout } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/messages/conversations')
      .then((response) => setConversations(response.data.items || []))
      .catch(() => setError('Impossible de charger les conversations'));
  }, []);

  return (
    <div className="page">
      <NavBar user={user} onLogout={logout} />
      <main>
        <h1>Messages</h1>
        {error && <div className="error">{error}</div>}
        {conversations.length === 0 ? (
          <p>Aucune conversation pour le moment.</p>
        ) : (
          <ul className="item-list">
            {conversations.map((conversation) => (
              <li key={conversation.id}>
                <strong>{conversation.title || 'Conversation'}</strong>
                <p>{conversation.last_message || '...'}</p>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
