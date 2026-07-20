import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      textAlign: 'center',
      padding: '40px 20px',
      background: 'var(--bg-deep)',
    }}>
      <div style={{
        fontSize: '6rem',
        marginBottom: 24,
        animation: 'float 4s ease-in-out infinite',
        filter: 'drop-shadow(0 8px 24px rgba(124,58,237,0.3))',
      }}>
        ✦
      </div>

      <div style={{
        fontSize: 'clamp(4rem, 10vw, 7rem)',
        fontWeight: 900,
        letterSpacing: '-0.06em',
        background: 'linear-gradient(135deg, var(--primary-light), var(--gold))',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        marginBottom: 12,
        lineHeight: 1,
      }}>
        404
      </div>

      <h1 style={{
        fontSize: 'clamp(1.5rem, 3vw, 2rem)',
        fontWeight: 800,
        color: 'var(--text-primary)',
        marginBottom: 12,
        letterSpacing: '-0.03em',
      }}>
        Page introuvable
      </h1>

      <p style={{
        color: 'var(--text-muted)',
        fontSize: '0.95rem',
        maxWidth: 360,
        lineHeight: 1.7,
        marginBottom: 36,
      }}>
        Il semble que cette page n'existe pas ou a été déplacée.
        Revenons à quelque chose de familier.
      </p>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link to="/" className="btn btn-primary btn-lg">
          🏠 Accueil
        </Link>
        <Link to="/app" className="btn btn-ghost btn-lg">
          📰 Voir le feed
        </Link>
      </div>

      {/* Decorative */}
      <div style={{
        position: 'fixed',
        inset: 0,
        background: 'radial-gradient(ellipse at center, rgba(124,58,237,0.08) 0%, transparent 60%)',
        pointerEvents: 'none',
        zIndex: -1,
      }} />
    </div>
  );
}
