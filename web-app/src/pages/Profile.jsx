import { useEffect, useState } from 'react';
import api from '../api';
import NavBar from '../components/NavBar';
import { useAuth } from '../hooks/useAuth';

export default function Profile() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/users/me')
      .then((response) => setProfile(response.data))
      .catch(() => setError('Impossible de charger le profil'));
  }, []);

  return (
    <div className="page">
      <NavBar user={user} onLogout={logout} />
      <main>
        <h1>Mon profil</h1>
        {error && <div className="error">{error}</div>}
        {profile ? (
          <div className="profile-card">
            <p><strong>Nom</strong> : {profile.username}</p>
            <p><strong>Email</strong> : {profile.email}</p>
            <p><strong>Statut</strong> : {profile.status}</p>
            <p><strong>Rôle</strong> : {profile.role}</p>
          </div>
        ) : (
          <p>Chargement...</p>
        )}
      </main>
    </div>
  );
}
