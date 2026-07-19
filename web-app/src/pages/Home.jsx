import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Home() {
  const { user, loading } = useAuth();

  return (
    <div className="page home-page">
      <h1>Bienvenue sur Epika Social</h1>
      <p>Découvrez votre communauté, suivez les groupes et restez connecté avec vos amis.</p>
      <div className="home-actions">
        {loading ? (
          <p>Chargement...</p>
        ) : user ? (
          <Link to="/app">Accéder au feed</Link>
        ) : (
          <Link to="/login">Se connecter</Link>
        )}
        <Link to="/docs">Voir la documentation API</Link>
      </div>
    </div>
  );
}
