import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, AlertCircle, LogIn, Heart, ArrowRight } from 'lucide-react';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export default function Login() {
  const navigate = useNavigate();
  const { login, loginWithGoogle, register, sendVerificationCode } = useAuth();
  const [mode, setMode] = useState('login');
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const googleContainerRef = useRef(null);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !googleContainerRef.current) return;
    if (!window.google?.accounts?.id) return;

    const handleCredentialResponse = async (response) => {
      try {
        setLoading(true);
        setError('');
        await loginWithGoogle(response.credential);
        navigate('/');
      } catch (err) {
        setError(err.response?.data?.message || 'Connexion Google impossible');
      } finally {
        setLoading(false);
      }
    };

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleCredentialResponse,
    });

    window.google.accounts.id.renderButton(googleContainerRef.current, {
      theme: 'outline',
      size: 'large',
      width: '100%',
      text: 'continue_with',
      locale: 'fr',
    });
  }, [loginWithGoogle, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        await login({ email: formData.email, password: formData.password });
        navigate('/');
      } else {
        await register({
          username: formData.username,
          email: formData.email,
          password: formData.password,
        });
        await sendVerificationCode(formData.email);
        navigate('/verify-email', { state: { email: formData.email } });
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-brand-side">
        <div className="auth-brand-inner">
          <div className="auth-brand-logo">
            <Heart size={22} fill="currentColor" />
          </div>
          <div className="auth-brand-name">
            <small>Église</small>
            <strong>Epika Social</strong>
          </div>
        </div>

        <div className="auth-hero-copy">
          <h1>
            Rejoignez une communauté
            <br />
            <span className="accent">bienveillante.</span>
          </h1>
          <p className="auth-hero-quote">
            « Car là où deux ou trois sont assemblés en mon nom, je suis au milieu d'eux. »
            <span className="auth-hero-quote-ref">— Matthieu 18:20</span>
          </p>
          <div className="auth-hero-points">
            <div className="hero-point"><span className="dot" />Partagez votre foi</div>
            <div className="hero-point"><span className="dot" />Priez ensemble</div>
            <div className="hero-point"><span className="dot" />Grandissez en communauté</div>
          </div>
        </div>

        <div className="auth-brand-footer">
          <span>{'\u00A9'} Epika Social</span>
        </div>
      </div>

      <div className="auth-form-side">
        <div className="auth-form-card">
          <div className="auth-form-head">
            <h2>{mode === 'login' ? 'Bon retour' : 'Créer un compte'}</h2>
            <p>
              {mode === 'login'
                ? 'Connectez-vous pour retrouver votre communauté.'
                : 'Rejoignez-nous dès aujourd\'hui, c\'est gratuit.'}
            </p>
          </div>

          {error && (
            <div className="alert alert-error">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {GOOGLE_CLIENT_ID && (
            <>
              <div ref={googleContainerRef} className="google-btn-wrap" />
              <div className="divider"><span>ou</span></div>
            </>
          )}

          <form className="form" onSubmit={handleSubmit}>
            {mode === 'register' && (
              <div className="form-group">
                <label className="form-label" htmlFor="username">Nom d'utilisateur</label>
                <input
                  id="username"
                  className="form-input"
                  type="text"
                  placeholder="ex. jean_dupont"
                  autoComplete="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                  minLength={2}
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
                autoComplete="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <div className="form-label-row">
                <label className="form-label" htmlFor="password">Mot de passe</label>
                {mode === 'login' && (
                  <a href="#" className="form-link">Mot de passe oublié ?</a>
                )}
              </div>
              <div className="form-input-wrap">
                <input
                  id="password"
                  className="form-input"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  className="input-suffix-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Masquer' : 'Afficher le mot de passe'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className={`btn btn-primary btn-lg btn-full${loading ? ' btn-loading' : ''}`}
              disabled={loading}
            >
              {loading ? '' : (
                <>
                  {mode === 'login' ? <><LogIn size={18} /> Se connecter</> : <>Créer mon compte <ArrowRight size={18} /></>}
                </>
              )}
            </button>
          </form>

          <div className="form-foot">
            {mode === 'login' ? 'Pas encore de compte ? ' : 'Déjà membre ? '}
            <button type="button" className="btn-link" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>
              {mode === 'login' ? "S'inscrire" : 'Se connecter'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
