import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import ToastContainer from '../components/Toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError('');
    try {
      await login(email, password, 'web');
      navigate('/app');
    } catch (err) {
      setError(err.response?.data?.message || 'Email ou mot de passe incorrect');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Branding Side */}
      <div className="login-branding" aria-hidden="true">
        <div className="login-branding-logo">✦</div>
        <div className="login-branding-title">Epika Social</div>
        <p className="login-branding-text">
          "Car là où deux ou trois sont assemblés en mon nom, je suis au milieu d'eux."
          <br /><br />
          <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Matthieu 18:20</span>
        </p>

        {/* Decorative orbs */}
        <div style={{
          position: 'absolute',
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(245,158,11,0.12), transparent)',
          top: '15%',
          right: '10%',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute',
          width: 150,
          height: 150,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124,58,237,0.15), transparent)',
          bottom: '20%',
          left: '5%',
          pointerEvents: 'none',
        }} />
      </div>

      {/* Form Side */}
      <div className="login-form-side">
        <div className="login-form-box">
          {/* Logo mobile */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
            <div style={{
              width: 40,
              height: 40,
              background: 'linear-gradient(135deg, var(--primary), #A855F7)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.2rem',
              boxShadow: '0 4px 16px var(--primary-glow)',
            }}>✦</div>
            <span style={{
              fontWeight: 800,
              fontSize: '1.1rem',
              background: 'linear-gradient(135deg, var(--primary-light), var(--gold))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>Epika Social</span>
          </div>

          <h1 className="login-form-title">Bon retour 👋</h1>
          <p className="login-form-sub">
            Pas encore membre ?{' '}
            <Link to="/">Rejoindre la communauté</Link>
          </p>

          <form onSubmit={handleSubmit} noValidate>
            {/* Email */}
            <div className="form-group">
              <label htmlFor="login-email" className="form-label">Adresse email</label>
              <input
                id="login-email"
                type="email"
                className={`form-input${error ? ' error-input' : ''}`}
                placeholder="vous@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div className="form-group">
              <label htmlFor="login-password" className="form-label">Mot de passe</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="login-password"
                  type={showPass ? 'text' : 'password'}
                  className={`form-input${error ? ' error-input' : ''}`}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  style={{ paddingRight: 48 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  aria-label={showPass ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  style={{
                    position: 'absolute',
                    right: 14,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    fontSize: '1rem',
                    padding: 0,
                  }}
                >
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="error-box" style={{ marginBottom: 16 }}>
                <span>⚠️</span> {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              id="login-submit"
              className={`btn btn-primary btn-full btn-lg${loading ? ' btn-loading' : ''}`}
              disabled={loading || !email || !password}
              style={{ marginTop: 8 }}
            >
              {loading ? '' : '✦ Se connecter'}
            </button>

            <div style={{ textAlign: 'center', marginTop: 24, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              En vous connectant, vous acceptez nos conditions d'utilisation.
            </div>
          </form>

          <div style={{ marginTop: 32, textAlign: 'center' }}>
            <Link to="/" style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              ← Retour à l'accueil
            </Link>
          </div>
        </div>
      </div>

      <ToastContainer />
    </div>
  );
}
