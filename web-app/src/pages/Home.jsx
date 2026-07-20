import { useAuth } from '../hooks/useAuth';
import { Link } from 'react-router-dom';
import ToastContainer from '../components/Toast';
import { HeartHandshake, MessageCircle, Users, Bell, ShieldCheck, Smartphone, HandHeart } from 'lucide-react';

const FEATURES = [
  {
    icon: <HeartHandshake size={24} color="var(--primary-light)" />,
    bg: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(167,139,250,0.1))',
    title: 'Communauté Chrétienne',
    desc: 'Partagez témoignages, prières et louanges dans un espace bienveillant et sécurisé.',
  },
  {
    icon: <MessageCircle size={24} color="var(--gold-light)" />,
    bg: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(252,211,77,0.1))',
    title: 'Messagerie Instantanée',
    desc: 'Discutez en privé ou en groupe avec les membres de votre communauté.',
  },
  {
    icon: <Users size={24} color="var(--green)" />,
    bg: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(52,211,153,0.1))',
    title: 'Groupes & Cercles',
    desc: 'Rejoignez des groupes thématiques — Bible, Prière, Louange, Jeunes, Famille.',
  },
  {
    icon: <Bell size={24} color="var(--red)" />,
    bg: 'linear-gradient(135deg, rgba(239,68,68,0.2), rgba(248,113,113,0.1))',
    title: 'Notifications Temps Réel',
    desc: 'Ne manquez jamais une mention, un commentaire ou un événement communautaire.',
  },
  {
    icon: <ShieldCheck size={24} color="#60A5FA" />,
    bg: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(96,165,250,0.1))',
    title: 'Modération Avancée',
    desc: 'Tableau d\'administration complet pour maintenir un environnement sain.',
  },
  {
    icon: <Smartphone size={24} color="var(--text-secondary)" />,
    bg: 'var(--glass)',
    title: 'Multiplateforme',
    desc: 'Disponible sur Web, iOS et Android — votre communauté partout avec vous.',
  },
];

export default function Home() {
  const { user, loading } = useAuth();

  return (
    <div className="landing-page">
      {/* Nav */}
      <nav className="landing-nav" role="navigation" aria-label="Navigation principale">
        <div className="landing-logo">
          <div className="landing-logo-icon">✦</div>
          Epika Social
        </div>
        <div className="landing-nav-actions">
          <a href="/docs" target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">
            API Docs
          </a>
          {loading ? null : user ? (
            <Link to="/app" className="btn btn-primary btn-sm">
              Accéder au feed
            </Link>
          ) : (
            <Link to="/login" className="btn btn-primary btn-sm">
              Se connecter
            </Link>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="landing-hero" aria-labelledby="hero-title">
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 800, margin: '0 auto' }}>
          <div className="hero-eyebrow">
            <span>Réseau Social Chrétien</span>
          </div>

          <h1 id="hero-title" className="hero-title">
            Connectez-vous,<br />
            <span className="hero-title-gradient">Grandissez ensemble</span>
          </h1>

          <p className="hero-subtitle">
            Epika Social est le réseau communautaire chrétien moderne — partagez votre foi,
            rejoignez des groupes et construisez des liens authentiques dans la bienveillance.
          </p>

          <div className="hero-actions">
            {loading ? (
              <div className="splash-spinner" />
            ) : user ? (
              <>
                <Link to="/app" className="btn btn-primary btn-xl">
                  Accéder au feed
                </Link>
                <Link to="/groups" className="btn btn-ghost btn-xl">
                  Voir les groupes
                </Link>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-primary btn-xl" id="cta-login">
                  Rejoindre la communauté
                </Link>
                <a href="/docs" target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-xl">
                  Documentation API
                </a>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="landing-features" aria-labelledby="features-title">
        <h2 id="features-title" className="features-title">
          Tout ce dont votre communauté a besoin
        </h2>
        <div className="features-grid">
          {FEATURES.map((f) => (
            <div key={f.title} className="feature-item">
              <div className="feature-icon" style={{ background: f.bg }}>
                {f.icon}
              </div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section style={{
        padding: '60px 40px',
        textAlign: 'center',
        background: 'linear-gradient(135deg, rgba(139,92,246,0.1) 0%, rgba(245,158,11,0.06) 100%)',
        borderTop: '1px solid var(--border)',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
            <HandHeart size={48} color="var(--primary-light)" />
          </div>
          <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 16 }}>
            Prêt à rejoindre la famille ?
          </h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: 28, fontSize: '0.95rem' }}>
            Des milliers de chrétiens partagent déjà leur foi sur Epika Social. Rejoignez-les aujourd'hui.
          </p>
          {!user && (
            <Link to="/login" className="btn btn-primary btn-xl">
              Commencer gratuitement
            </Link>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer" role="contentinfo">
        <p>
          Epika Social — Réseau Communautaire Chrétien · © {new Date().getFullYear()} ·{' '}
          <a href="/docs" style={{ color: 'var(--primary-light)' }}>API Documentation</a>
        </p>
      </footer>

      <ToastContainer />
    </div>
  );
}
