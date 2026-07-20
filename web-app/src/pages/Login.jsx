import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import ToastContainer from '../components/Toast';
import { Eye, EyeOff, AlertCircle, LogIn, Heart } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(formData.email, formData.password, 'web');
        navigate('/app');
      } else {
        const api = (await import('../api')).default;
        await api.post('/users/register', { ...formData, device: 'web' });
        await login(formData.email, formData.password, 'web');
        navigate('/app');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page" style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-deep)' }}>
      {/* Brand Side (hidden on mobile) */}
      <div className="auth-brand" style={{ flex: 1, background: 'linear-gradient(135deg, var(--bg-surface) 0%, var(--bg-deep) 100%)', padding: 60, display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border)' }}>
        <div className="auth-brand-content" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 'auto', textDecoration: 'none' }}>
            <div style={{
              width: 40, height: 40, background: 'var(--primary)', color: '#fff',
              borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: '1.4rem', boxShadow: '0 8px 32px rgba(139,92,246,0.2)'
            }}>
              <Heart size={20} fill="currentColor" />
            </div>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              Epika Social
            </span>
          </Link>

          <div>
            <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800, lineHeight: 1.1, marginBottom: 24, color: 'var(--text-primary)' }}>
              Rejoignez une communauté bienveillante.
            </h1>
            <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', maxWidth: 400, lineHeight: 1.6 }}>
              "Car là où deux ou trois sont assemblés en mon nom, je suis au milieu d'eux."<br/>
              <span style={{ fontSize: '0.9rem', opacity: 0.7, marginTop: 8, display: 'block' }}>— Matthieu 18:20</span>
            </p>
          </div>
        </div>
      </div>

      {/* Form Side */}
      <div className="auth-form-side" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div className="auth-form-container" style={{ width: '100%', maxWidth: 400 }}>
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: 8, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              {isLogin ? 'Bon retour' : 'Créer un compte'}
            </h2>
            <p style={{ color: 'var(--text-muted)' }}>
              {isLogin ? 'Connectez-vous pour retrouver votre communauté.' : 'Rejoignez-nous dès aujourd\'hui.'}
            </p>
          </div>

          {error && (
            <div className="error-box" style={{ marginBottom: 24 }}>
              <AlertCircle size={18} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {!isLogin && (
              <div className="form-group">
                <label className="form-label" htmlFor="username">Nom d'utilisateur</label>
                <input
                  id="username"
                  className="form-input"
                  type="text"
                  placeholder="Jean Dupont"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="email">Email</label>
              <input
                id="email"
                className="form-input"
                type="email"
                placeholder="jean@exemple.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <label className="form-label" htmlFor="password">Mot de passe</label>
                {isLogin && <a href="#" style={{ fontSize: '0.8rem', color: 'var(--primary-light)', fontWeight: 500, textDecoration: 'none' }}>Mot de passe oublié ?</a>}
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  id="password"
                  className="form-input"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4
                  }}
                  aria-label={showPassword ? 'Masquer' : 'Afficher'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className={`btn btn-primary btn-lg btn-full${loading ? ' btn-loading' : ''}`}
              style={{ marginTop: 12 }}
              disabled={loading}
            >
              {loading ? '' : isLogin ? <><LogIn size={18} /> Se connecter</> : 'Créer mon compte'}
            </button>
          </form>

          <div style={{ marginTop: 32, textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            {isLogin ? "Pas encore de compte ? " : "Déjà membre ? "}
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              style={{ background: 'none', border: 'none', color: 'var(--primary-light)', fontWeight: 600, cursor: 'pointer', padding: 0 }}
            >
              {isLogin ? 'S\'inscrire' : 'Se connecter'}
            </button>
          </div>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
}
