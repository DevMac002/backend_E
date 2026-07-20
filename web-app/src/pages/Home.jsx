import { useAuth } from '../hooks/useAuth';

export default function Home() {
  const { user, loading } = useAuth();

  return (
    <div className="page home-page">
      <section className="hero">
        <span className="eyebrow">Application Web</span>
        <h1>Epika Social — votre réseau communautaire moderne</h1>
        <p>Un espace sécurisé pour partager des publications, rejoindre des groupes, discuter et suivre l’actualité de la communauté.</p>
        <div className="home-actions">
          {loading ? (
            <p>Chargement...</p>
          ) : user ? (
            <a href="/app" className="button button-primary">Accéder au feed</a>
          ) : (
            <a href="/login" className="button button-primary">Se connecter</a>
          )}
          <a href="/docs" target="_blank" rel="noopener noreferrer" className="button button-secondary">Voir la documentation API</a>
        </div>
      </section>

      <section className="feature-grid">
        <div className="feature-card">
          <h2>Engagez votre communauté</h2>
          <p>Publiez des messages, réagissez aux posts et suivez les discussions de groupes en temps réel.</p>
        </div>
        <div className="feature-card">
          <h2>Administration simplifiée</h2>
          <p>Tableau admin dédié pour gérer les utilisateurs, les contenus et les paramètres de la communauté.</p>
        </div>
        <div className="feature-card">
          <h2>Documentation API</h2>
          <p>Accédez aux routes backend, aux schémas et aux exemples directement depuis le service.</p>
        </div>
      </section>
    </div>
  );
}
